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

# Main RAG answer function
def answer_question(question, role):
    docs = retrieve_docs(question, role)
    if not docs:
        return "No relevant documents found or access denied."
    context = "\n".join([doc["content"] for doc in docs])
    llm = ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile"
    )
    prompt = f"""You are a helpful company assistant. Use only the context provided.
Context:
{context}
Question: {question}
Answer as accurately and concisely as possible."""
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
