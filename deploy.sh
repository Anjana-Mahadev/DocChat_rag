#!/usr/bin/env bash
# =============================================================================
# DocChat EC2 Deployment Script
# Configures Nginx, Gunicorn (uvicorn), and the React frontend on Ubuntu EC2
# 
# Usage:
#   1. Launch an Ubuntu 22.04+ EC2 instance (open ports 22, 80, 443)
#   2. SSH in and clone your repo:  git clone <your-repo> ~/rag && cd ~/rag
#   3. Set your env vars:           cp .env.example .env && nano .env
#   4. Run:                         chmod +x deploy.sh && sudo ./deploy.sh
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_USER="${SUDO_USER:-ubuntu}"
DOMAIN="_"                        # Replace with your domain, or "_" for IP-based access
BACKEND_PORT=8000
PYTHON_VERSION="python3"
SERVICE_NAME="docchat"

echo "============================================"
echo "  DocChat EC2 Deployment"
echo "  App dir:  $APP_DIR"
echo "  User:     $APP_USER"
echo "============================================"

# ── 1. System packages ───────────────────────────────────────────────────────
echo "[1/7] Installing system dependencies..."
apt-get update -y
apt-get install -y \
  python3 python3-pip python3-venv \
  nginx \
  curl git build-essential

# Install Node.js 20 LTS if not present
if ! command -v node &>/dev/null; then
  echo "  -> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "  Python: $(python3 --version)"
echo "  Node:   $(node --version)"
echo "  npm:    $(npm --version)"
echo "  Nginx:  $(nginx -v 2>&1)"

# ── 2. Python venv & backend dependencies ────────────────────────────────────
echo "[2/7] Setting up Python virtual environment..."
cd "$APP_DIR"

if [ ! -d "venv" ]; then
  $PYTHON_VERSION -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn uvicorn[standard]

# ── 3. Check for .env ────────────────────────────────────────────────────────
echo "[3/7] Checking environment configuration..."
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "  ⚠  No .env file found!"
  echo "  Create $APP_DIR/.env with at minimum:"
  echo "     GROQ_API_KEY=your_key_here"
  echo ""
  echo "  Then re-run this script."
  exit 1
fi

# ── 4. Build React frontend ──────────────────────────────────────────────────
echo "[4/6] Building React frontend..."
cd "$APP_DIR/frontend"

# Replace hardcoded localhost API URLs with relative paths so Nginx proxying works
echo "  -> Patching API URLs to use relative paths..."
find src/ -name '*.js' -exec sed -i \
  -e "s|http://127\.0\.0\.1:8000||g" \
  -e "s|http://localhost:8000||g" \
  {} +

npm install
npm run build

# ── 5. Systemd service for FastAPI backend ───────────────────────────────────
echo "[5/6] Creating systemd service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=DocChat FastAPI Backend
After=network.target

[Service]
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=${APP_DIR}/venv/bin/gunicorn app:app \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --workers 2 \\
    --bind 127.0.0.1:${BACKEND_PORT} \\
    --timeout 120
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}

echo "  -> Backend service started on port ${BACKEND_PORT}"

# ── 6. Nginx configuration ───────────────────────────────────────────────────
echo "[6/6] Configuring Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/${SERVICE_NAME} <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # ── React frontend (static files) ──
    root ${APP_DIR}/frontend/build;
    index index.html;

    # ── API routes → FastAPI backend ──
    location /register {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location /token {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /query {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    # ── React client-side routing (SPA fallback) ──
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # ── Cache static assets ──
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

ln -sf /etc/nginx/sites-available/${SERVICE_NAME} /etc/nginx/sites-enabled/${SERVICE_NAME}

# Validate and reload
nginx -t
systemctl enable nginx
systemctl restart nginx

# ── Done ─────────────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s --connect-timeout 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<your-ec2-public-ip>")

echo ""
echo "============================================"
echo "  ✓ Deployment complete!"
echo ""
echo "  Frontend:  http://${PUBLIC_IP}"
echo "  Backend:   http://127.0.0.1:${BACKEND_PORT} (internal)"
echo ""
echo "  Useful commands:"
echo "    sudo systemctl status ${SERVICE_NAME}   # backend status"
echo "    sudo journalctl -u ${SERVICE_NAME} -f   # backend logs"
echo "    sudo systemctl restart ${SERVICE_NAME}   # restart backend"
echo "    sudo systemctl restart nginx             # restart nginx"
echo "============================================"
