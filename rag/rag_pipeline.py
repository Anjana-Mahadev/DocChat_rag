# Core RAG pipeline: retrieval, RBAC, LLM

import os
import argparse
from langchain_community.vectorstores.faiss import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
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


# Retrieve docs with hybrid search (dense + sparse) and RBAC filtering
def retrieve_docs(question, role, k=5):
    db = load_vector_store()
    
    # Dense retrieval (semantic similarity via embeddings)
    dense_results = db.similarity_search_with_score(question, k=k)
    
    # Sparse retrieval (keyword-based BM25)
    docs_list = list(db.docstore._dict.values())
    sparse_retriever = BM25Retriever.from_documents(docs_list)
    sparse_retriever.k = k
    sparse_results = sparse_retriever.invoke(question)
    
    # Combine results: dense (60% weight) + sparse (40% weight)
    # Create a combined dict for deduplication
    combined = {}
    
    # Add dense results
    for doc, score in dense_results:
        doc_id = doc.page_content[:100]
        if doc_id not in combined:
            combined[doc_id] = {"doc": doc, "score": score * 0.6}
    
    # Add sparse results (note: sparse results don't have scores by default)
    for doc in sparse_results:
        doc_id = doc.page_content[:100]
        if doc_id not in combined:
            combined[doc_id] = {"doc": doc, "score": 0.4}
        else:
            # If already in combined, boost the score
            combined[doc_id]["score"] += 0.4
    
    # Sort by combined score
    sorted_docs = sorted(combined.items(), key=lambda x: x[1]["score"], reverse=True)
    
    # Filter by RBAC
    filtered = []
    for doc_id, item in sorted_docs:
        doc = item["doc"]
        meta = doc.metadata
        if has_access(role, meta.get("department", "general")):
            filtered.append({
                "content": doc.page_content,
                "department": meta.get("department"),
                "filename": meta.get("filename"),
                "score": item["score"]
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

    # Check if question is a simple greeting
    greeting_words = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy", "greetings"]
    is_greeting = any(word in question.lower() for word in greeting_words)
    
    if is_greeting:
        # Simple greeting response
        response = llm.invoke(f"User says: {question}\n\nRespond briefly and naturally, like a friendly assistant. Keep it to 1-2 sentences.")
        return response.content if hasattr(response, "content") else str(response)
    
    # Standard Q&A prompt for document-based queries
    prompt = f"""You are a helpful company assistant.

{history_section}Retrieved Documents:
{context}

Question: {question}

Answer based on the documents and conversation history. Be accurate and concise. If info is not in documents, say so."""
    
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
