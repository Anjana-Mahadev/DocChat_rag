"""
Ingest documents from resources/, chunk them, generate embeddings, and index in FAISS.
Each chunk is tagged with its department for RBAC filtering.
"""
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores.faiss import FAISS

RESOURCE_DIR = os.path.join(os.path.dirname(__file__), '../resources')
DEPARTMENTS = ['engineering', 'finance', 'general', 'hr', 'marketing']

# Helper to load all text files

def load_documents():
    docs = []
    for dept in DEPARTMENTS:
        dept_dir = os.path.join(RESOURCE_DIR, dept)
        for fname in os.listdir(dept_dir):
            if fname.endswith('.md') or fname.endswith('.txt') or fname.endswith('.csv'):
                with open(os.path.join(dept_dir, fname), 'r', encoding='utf-8', errors='ignore') as f:
                    docs.append({
                        'content': f.read(),
                        'department': dept,
                        'filename': fname
                    })
    return docs

def chunk_documents(docs, chunk_size=500, chunk_overlap=50):
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = []
    for doc in docs:
        for chunk in splitter.split_text(doc['content']):
            chunks.append({
                'content': chunk,
                'department': doc['department'],
                'filename': doc['filename']
            })
    return chunks

def build_faiss_index():
    docs = load_documents()
    chunks = chunk_documents(docs)
    texts = [c['content'] for c in chunks]
    metadatas = [{'department': c['department'], 'filename': c['filename']} for c in chunks]
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    db = FAISS.from_texts(texts, embeddings, metadatas=metadatas)
    db.save_local('faiss_index')
    print(f"Indexed {len(chunks)} chunks.")

if __name__ == "__main__":
    build_faiss_index()
