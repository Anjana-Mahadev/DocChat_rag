# RAG Chatbot Platform

This project is a full-stack Retrieval-Augmented Generation (RAG) chatbot platform with robust security, explainability, and modern UI. It is designed for enterprise use, supporting department-level access control, PII guardrails, and advanced monitoring.

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
- **Monitoring:**
	- Ragas and LangSmith integration for evaluation and tracing
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

## Monitoring & Evaluation

- **Ragas**: RAG evaluation
- **LangSmith**: LLM tracing

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

## Ragas Evaluation Example

To use Ragas for evaluation, you need an evaluation set (CSV or DataFrame) with columns:
- `question`: The user query
- `ground_truth`: The expected answer
- `contexts`: (Optional) Reference context(s) used for answering

### Example CSV Format

| question                  | ground_truth                | contexts                |
|---------------------------|-----------------------------|-------------------------|
| What is our Q4 revenue?   | $1.2M                       | [context chunk text]    |
| Who is the HR manager?    | Alice Smith                 | [context chunk text]    |

### Example Usage in Code

```python
import pandas as pd
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

# Load your evaluation set
examples = pd.read_csv('eval_set.csv')

# Run your RAG pipeline to get answers and retrieved contexts
examples['answer'] = examples['question'].apply(your_rag_answer_fn)
examples['contexts'] = examples['question'].apply(your_rag_context_fn)

# Evaluate
results = evaluate(
    examples,
    metrics=[faithfulness, answer_relevancy]
)
print(results)
```

- See [Ragas docs](https://github.com/explodinggradients/ragas) for more details and advanced metrics.

