# Core RAG pipeline: retrieval, RBAC, LLM

import os
import argparse
from langchain_community.vectorstores.faiss import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from rag.rbac import has_access, get_user_role
from langchain_groq import ChatGroq


# Load FAISS vector store
def load_vector_store():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    db = FAISS.load_local(
        os.path.join(os.path.dirname(__file__), "faiss_index"),
        embeddings,
        allow_dangerous_deserialization=True
    )
    return db


# Retrieve docs with RBAC filtering
def retrieve_docs(question, role, k=5):
    db = load_vector_store()
    docs_and_scores = db.similarity_search_with_score(question, k=k)
    # Filter by RBAC
    filtered = []
    for doc, score in docs_and_scores:
        meta = doc.metadata
        if has_access(role, meta.get("department", "general")):
            filtered.append({
                "content": doc.page_content,
                "department": meta.get("department"),
                "filename": meta.get("filename"),
                "score": score
            })
    return filtered

# Build a history-aware search query so retrieval considers conversation context
def _build_search_query(question, history):
    if not history:
        return question
    # Take the last few user messages to enrich the search query
    recent_user_msgs = [m["content"] for m in history if m["role"] == "user"][-3:]
    return " ".join(recent_user_msgs + [question])


# Main RAG answer function
def answer_question(question, role, history=None):
    search_query = _build_search_query(question, history)
    docs = retrieve_docs(search_query, role)
    if not docs:
        return "No relevant documents found or access denied."
    context = "\n".join([doc["content"] for doc in docs])
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile"
    )

    # Build conversation history string
    history_section = ""
    if history:
        lines = []
        for msg in history:
            prefix = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{prefix}: {msg['content']}")
        history_section = "Conversation History:\n" + "\n".join(lines) + "\n\n"

    prompt = f"""You are a helpful company assistant.

{history_section}Retrieved Documents:
{context}

Current Question: {question}

Instructions:
- Answer the current question using the retrieved documents and conversation history above.
- If the current question is a follow-up or refers to something from the conversation history, use that context to give a relevant answer.
- If the answer is not found in the documents, say so clearly.
- Structure your answer clearly using Markdown formatting:
  - Use numbered lists (1. 2. 3.) for sequential steps or processes.
  - Use bullet points (- ) for non-sequential items, sub-details, or lists of options.
  - Use **bold** for key terms, policy names, or important values.
  - Break your answer into logical sections when covering multiple topics.
- Be accurate, well-organized, and concise."""
    response = llm.invoke(prompt)
    return response.content if hasattr(response, "content") else str(response)

# CLI entrypoint
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RAG pipeline CLI")
    parser.add_argument("--question", type=str, required=True, help="User question")
    parser.add_argument("--user", type=str, required=True, help="User ID (e.g., alice, bob, carol)")
    args = parser.parse_args()
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
    role = get_user_role(args.user)
    answer = answer_question(args.question, role)
    print(f"\n[User: {args.user} | Role: {role}]\nQ: {args.question}\nA: {answer}\n")
