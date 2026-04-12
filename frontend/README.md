# RAG Frontend

This is a simple React frontend for registration and login to your RAG chatbot backend.

## Getting Started

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. The app will run at [http://localhost:3000](http://localhost:3000)

- Registration form: POSTs to `http://127.0.0.1:8000/register`
- Login form: POSTs to `http://127.0.0.1:8000/token` (OAuth2 password flow)
- On login, JWT token is shown (for use in API requests)

## Next Steps
- Integrate chat UI and secure API calls with JWT
- Add logout and user feedback
