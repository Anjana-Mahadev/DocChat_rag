# RAG Chatbot Platform

A production-ready, full-stack **Retrieval-Augmented Generation (RAG)** chatbot built for enterprise environments. Users ask natural-language questions and receive accurate, department-scoped answers grounded in internal company documents — not generic LLM knowledge.

### Why This Project?

Large Language Models are powerful, but they hallucinate and lack access to private data. This platform solves both problems by:

1. **Retrieval** — Relevant document chunks are fetched from a FAISS vector store using semantic search, so answers are grounded in real company data.
2. **Access Control** — Role-Based Access Control (RBAC) ensures each user only sees documents they are authorized to access (finance, HR, engineering, etc.).
3. **Safety** — Input guardrails block PII leakage, profanity, and off-topic queries before they ever reach the LLM.
4. **Modern Stack** — A React frontend communicates over JWT-secured REST APIs with a FastAPI backend, which orchestrates the full RAG pipeline and calls a Groq-hosted Llama-3.3-70b model.

### Key Capabilities

| Capability | Details |
|---|---|
| **LLM** | Groq API — Llama-3.3-70b-versatile |
| **Embeddings** | HuggingFace all-MiniLM-L6-v2 (local) |
| **Vector Store** | FAISS (CPU) |
| **Auth** | JWT (OAuth2 password flow) + bcrypt password hashing |
| **RBAC** | 6 roles, 6 department scopes |
| **Guardrails** | PII detection, profanity filter, out-of-scope blocker |
| **Frontend** | React, React Router, Axios, Modular CSS |
| **Backend** | FastAPI, SQLAlchemy, SQLite |
| **Orchestration** | LangChain (retrieval + prompt assembly) |

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Login Page  │  │  Register   │  │  Chat UI     │  │  Landing Page    │  │
│  │  (JWT Auth)  │  │  Page       │  │  (React)     │  │                  │  │
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                │                                 │
│         └─────────────────┼────────────────┘                                │
│                           │  Axios HTTP (Bearer Token)                      │
└───────────────────────────┼─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND (app.py)                             │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         API Endpoints                                │   │
│  │  POST /api/register   POST /api/token   POST /api/query             │   │
│  └──────────┬───────────────────┬──────────────────┬────────────────────┘   │
│             │                   │                  │                        │
│             ▼                   ▼                  ▼                        │
│  ┌──────────────────┐  ┌───────────────┐  ┌───────────────────────────┐    │
│  │  Auth Layer       │  │  JWT Verify   │  │     Query Pipeline        │    │
│  │  ┌──────────────┐ │  │  (python-jose)│  │                           │    │
│  │  │ Registration │ │  │  OAuth2 Flow  │  │  1. Authenticate User     │    │
│  │  │ (bcrypt hash)│ │  └───────────────┘  │  2. Guardrails Check      │    │
│  │  └──────────────┘ │                     │  3. RAG Pipeline          │    │
│  │  ┌──────────────┐ │                     │  4. Return Answer         │    │
│  │  │ Login        │ │                     │                           │    │
│  │  │ (JWT issue)  │ │                     └─────────┬─────────────────┘    │
│  │  └──────────────┘ │                               │                     │
│  └────────┬──────────┘                               │                     │
│           │                                          │                     │
│           ▼                                          ▼                     │
│  ┌──────────────────┐                ┌───────────────────────────────────┐  │
│  │  SQLite Database  │                │      GUARDRAILS (guardrails.py)   │  │
│  │  (users.db)       │                │                                   │  │
│  │  ┌──────────────┐ │                │  ┌─────────┐ ┌─────────┐ ┌─────┐ │  │
│  │  │ Users Table  │ │                │  │   PII   │ │Profanity│ │ OOS │ │  │
│  │  │ - id         │ │                │  │  Detect │ │ Filter  │ │Check│ │  │
│  │  │ - username   │ │                │  └─────────┘ └─────────┘ └─────┘ │  │
│  │  │ - hashed_pw  │ │                │  Email/SSN/Phone  Blocked Words   │  │
│  │  │ - role       │ │                └───────────────┬───────────────────┘  │
│  │  └──────────────┘ │                                │ (if allowed)        │
│  └──────────────────┘                                ▼                     │
│                                      ┌───────────────────────────────────┐  │
│                                      │   RAG PIPELINE (rag_pipeline.py)  │  │
│                                      │                                   │  │
│                                      │  ┌─────────────────────────────┐  │  │
│                                      │  │  1. Build Search Query      │  │  │
│                                      │  │     (history-aware)         │  │  │
│                                      │  └──────────┬──────────────────┘  │  │
│                                      │             ▼                     │  │
│                                      │  ┌─────────────────────────────┐  │  │
│                                      │  │  2. Semantic Search (FAISS) │  │  │
│                                      │  │     similarity_search       │  │  │
│                                      │  └──────────┬──────────────────┘  │  │
│                                      │             ▼                     │  │
│                                      │  ┌─────────────────────────────┐  │  │
│                                      │  │  3. RBAC Filtering          │  │  │
│                                      │  │     (rbac.py → has_access)  │  │  │
│                                      │  └──────────┬──────────────────┘  │  │
│                                      │             ▼                     │  │
│                                      │  ┌─────────────────────────────┐  │  │
│                                      │  │  4. Prompt Construction     │  │  │
│                                      │  │     Context + History +     │  │  │
│                                      │  │     System Instructions     │  │  │
│                                      │  └──────────┬──────────────────┘  │  │
│                                      │             ▼                     │  │
│                                      │  ┌─────────────────────────────┐  │  │
│                                      │  │  5. LLM Invocation          │  │  │
│                                      │  │     Groq (Llama-3.3-70b)   │  │  │
│                                      │  └─────────────────────────────┘  │  │
│                                      └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                            │                          │
                            ▼                          ▼
┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│    FAISS VECTOR STORE             │  │         GROQ CLOUD API            │
│    (rag/faiss_index/)             │  │                                   │
│                                   │  │  Model: llama-3.3-70b-versatile  │
│  ┌─────────────────────────────┐  │  │  Provider: Groq                  │
│  │  Embeddings: MiniLM-L6-v2  │  │  └───────────────────────────────────┘
│  │  (HuggingFace/Sentence-    │  │
│  │   Transformers, local)     │  │
│  ├─────────────────────────────┤  │
│  │  Indexed Documents:        │  │
│  │  - Engineering docs        │  │
│  │  - Finance reports         │  │
│  │  - HR data                 │  │
│  │  - Marketing reports       │  │
│  │  - General handbook        │  │
│  ├─────────────────────────────┤  │
│  │  Chunk Metadata:           │  │
│  │  { department, filename }  │  │
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
```

### Data Ingestion Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DOCUMENT INGESTION (ingest.py)                     │
│                                                                      │
│  resources/                                                          │
│  ├── engineering/   ──┐                                              │
│  ├── finance/       ──┤                                              │
│  ├── general/       ──┼──▶  Load (.md, .csv, .txt)                  │
│  ├── hr/            ──┤         │                                    │
│  └── marketing/     ──┘         ▼                                    │
│                          ┌──────────────┐                            │
│                          │ Chunk Text   │  RecursiveCharacterText    │
│                          │ (500 chars,  │  Splitter (LangChain)      │
│                          │  50 overlap) │                            │
│                          └──────┬───────┘                            │
│                                 ▼                                    │
│                          ┌──────────────┐                            │
│                          │  Embed with  │  HuggingFace               │
│                          │  MiniLM-L6   │  all-MiniLM-L6-v2          │
│                          └──────┬───────┘                            │
│                                 ▼                                    │
│                          ┌──────────────┐                            │
│                          │  Index in    │  Each chunk stored with     │
│                          │  FAISS       │  { department, filename }   │
│                          └──────┬───────┘                            │
│                                 ▼                                    │
│                          rag/faiss_index/                             │
│                            index.faiss                               │
└──────────────────────────────────────────────────────────────────────┘
```

### Request Flow (Query Lifecycle)

```
User Question
     │
     ▼
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│  React   │────▶│  POST       │────▶│  JWT Auth    │
│  Chat UI │     │  /api/query │     │  Verification│
└──────────┘     └─────────────┘     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐    ┌──────────────┐
                                     │  Guardrails  │───▶│  403 if      │
                                     │  Check       │    │  PII/Profane │
                                     └──────┬───────┘    └──────────────┘
                                            │ (pass)
                                            ▼
                                     ┌──────────────┐
                                     │  Build Search│
                                     │  Query       │ (conversation-aware)
                                     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │  FAISS       │ Semantic similarity
                                     │  Retrieval   │ search (top-k=5)
                                     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │  RBAC Filter │ Filter docs by
                                     │              │ user role permissions
                                     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │  Prompt      │ Context + History +
                                     │  Assembly    │ Instructions
                                     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │  Groq LLM    │ Llama-3.3-70b
                                     │  (Remote)    │ versatile
                                     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │  JSON        │
                                     │  Response    │──▶ Chat UI
                                     └──────────────┘
```

### RBAC Access Matrix

```
                ┌──────────┬──────┬────┬───────────┬─────────────┬───────┬─────────┐
                │          │  FIN │ HR │ MARKETING │ ENGINEERING │ SALES │ GENERAL │
                ├──────────┼──────┼────┼───────────┼─────────────┼───────┼─────────┤
                │ finance  │  ✓   │    │     ✓     │             │       │    ✓    │
                │ hr       │      │ ✓  │           │             │       │    ✓    │
                │ c_level  │  ✓   │ ✓  │     ✓     │      ✓      │   ✓   │    ✓    │
                │ engineer │      │    │           │      ✓      │       │    ✓    │
                │ sales    │      │    │     ✓     │             │   ✓   │    ✓    │
                │ general  │      │    │           │             │       │    ✓    │
                └──────────┴──────┴────┴───────────┴─────────────┴───────┴─────────┘
```

### Tech Stack

```
┌───────────────────────────────────────────────────────────┐
│                      FRONTEND                             │
│  React · React Router · Axios · Modular CSS               │
├───────────────────────────────────────────────────────────┤
│                      BACKEND                              │
│  FastAPI · SQLAlchemy · python-jose (JWT) · bcrypt         │
├───────────────────────────────────────────────────────────┤
│                   RAG PIPELINE                            │
│  LangChain · FAISS · HuggingFace Embeddings (MiniLM)      │
├───────────────────────────────────────────────────────────┤
│                    LLM PROVIDER                           │
│  Groq API · Llama-3.3-70b-versatile                        │
├───────────────────────────────────────────────────────────┤
│                   DATA / STORAGE                          │
│  SQLite (users) · FAISS index (vectors) · Markdown/CSV     │
├───────────────────────────────────────────────────────────┤
│                   MONITORING (planned)                     │
│  Ragas (evaluation) · LangSmith (tracing)  — coming soon   │
└───────────────────────────────────────────────────────────┘
```

---

## Features

### Backend (Python/FastAPI)
- **RAG Pipeline:**
	- Uses Langchain for document retrieval and LLM orchestration
	- FAISS vector store for fast semantic search
	- HuggingFace embeddings (MiniLM)
- **RBAC (Role-Based Access Control):**
	- User roles (finance, hr, c_level, engineer, sales, general)
	- Department-level document access filtering
- **Guardrails:**
	- PII detection (email, SSN, phone)
	- Profanity and out-of-scope question blocking
- **Authentication:**
	- JWT-based login (OAuth2 password flow)
	- Password hashing (bcrypt)
- **Groq LLM Integration:**
	- Uses Groq API (Llama-3.3-70b-versatile) for answering questions
- **Data Ingestion:**
	- Ingests and chunks documents from `resources/` by department
	- Indexes with metadata for RBAC

### Frontend (React)
- **Chat UI:**
	- Chat interface with JWT-secured API calls
	- Department-aware responses
- **Authentication:**
	- Registration and login forms
	- JWT token handling
- **Routing:**
	- React Router for navigation (Home, Chat, Login, Register, NotFound)
- **Styling:**
	- Modular CSS for modern look

---

## Project Structure

```
├── app.py                # FastAPI backend entrypoint
├── models.py             # SQLAlchemy User model
├── requirements.txt      # Backend dependencies
├── rag/
│   ├── ingest.py         # Document ingestion & FAISS indexing
│   ├── rag_pipeline.py   # RAG pipeline (retrieval, RBAC, LLM)
│   ├── rbac.py           # Role-based access control logic
│   ├── guardrails.py     # PII/profanity/out-of-scope detection
│   └── faiss_index/      # FAISS vector DB
├── resources/            # Departmental documents (md, csv, etc)
├── frontend/             # React frontend app
│   ├── src/
│   │   ├── pages/        # Home, Chat, Login, Register, NotFound
│   │   ├── styles/       # CSS modules
│   │   └── ...           # Components (Chatbot, LoginForm, etc)
│   └── public/
└── ...
```

---

## Backend Setup

1. **Clone repo & create venv:**
	 ```bash
	 python3 -m venv venv
	 source venv/bin/activate
	 ```
2. **Install dependencies:**
	 ```bash
	 pip install -r requirements.txt
	 ```
3. **Set environment variables:**
	 - Create a `.env` file with your Groq API key:
		 ```env
		 GROQ_API_KEY=your_groq_api_key
		 ```
4. **Ingest documents & build FAISS index:**
	 ```bash
	 python rag/ingest.py
	 ```
5. **Run backend server:**
	 ```bash
	 uvicorn app:app --reload
	 ```

---

## Frontend Setup

1. **Install dependencies:**
	 ```bash
	 cd frontend
	 npm install
	 ```
2. **Start development server:**
	 ```bash
	 npm start
	 ```
3. **Access UI:**
	 - Open [http://localhost:3000](http://localhost:3000)

---

## Usage

1. **Register a user** via the frontend or POST `/register` (backend)
2. **Login** to receive a JWT token
3. **Chat**: Enter questions in the chat UI (token required)
4. **RBAC**: Only documents allowed by your role are retrieved
5. **Guardrails**: PII/profanity/out-of-scope questions are blocked

---

## User Roles & Permissions

| Role      | Departments Accessible                |
|-----------|--------------------------------------|
| finance   | finance, marketing, general          |
| hr        | hr, general                          |
| c_level   | all                                  |
| engineer  | engineering, general                 |
| sales     | sales, marketing, general            |
| general   | general                              |

---

## Security & Guardrails

- **PII Detection:** Email, SSN, phone numbers blocked
- **Profanity Filter:** Common cuss words blocked
- **Out-of-Scope:** Non-business queries (e.g., jokes, weather) blocked

---

## Roadmap

The following features are planned for future releases:

- [ ] **Ragas Evaluation** — Automated RAG quality metrics (faithfulness, answer relevancy) using the [Ragas](https://github.com/explodinggradients/ragas) framework
- [ ] **LangSmith Tracing** — End-to-end LLM call tracing and debugging via [LangSmith](https://smith.langchain.com/)
- [ ] **Streaming Responses** — Token-level streaming for faster perceived latency
- [ ] **Admin Dashboard** — Usage analytics, user management, and guardrail tuning
- [ ] **Multi-model Support** — Swap LLM providers without code changes

---

## Requirements

**Backend:**
```
fastapi
langchain
langchain-community
langchain-groq
sentence-transformers
faiss-cpu
groq
ragas
langsmith
python-dotenv
pydantic
uvicorn
python-jose
passlib[bcrypt]
python-multipart
bcrypt==4.1.2
```

**Frontend:**
```
react
react-dom
react-router-dom
axios
react-scripts
```

---

## License

MIT

