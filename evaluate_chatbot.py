#!/usr/bin/env python3
"""
Evaluate RAG chatbot using RAGAS metrics and custom evaluation logic.
Tracks failures to identify areas needing manual QA examples.

Usage:
    python evaluate_chatbot.py --role admin
    python evaluate_chatbot.py --role marketing --ragas
    python evaluate_chatbot.py --role finance --output eval_results.json
"""

import os
import sys
import json
import csv
import argparse
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

from dotenv import load_dotenv
from langchain_groq import ChatGroq

# Try to import RAGAS (optional)
try:
    from ragas import EvaluationDataset, evaluate
    from ragas.metrics import (
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall,
    )
    HAS_RAGAS = True
except ImportError:
    HAS_RAGAS = False

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag.rag_pipeline import retrieve_docs, answer_question
from rag.rbac import get_user_role

load_dotenv()


def load_eval_dataset(csv_path: str) -> list[dict]:
    """Load evaluation dataset from CSV."""
    examples = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            examples.append({
                "id": i,
                "question": row["question"].strip('"'),
                "expected_answer": row["answer"].strip('"'),
                "context_source": row["context"].strip('"'),
            })
    return examples


def _compute_ragas_metrics(eval_dataset: list[dict], role: str, llm) -> dict:
    """Compute RAGAS metrics for RAG evaluation."""
    if not HAS_RAGAS:
        print("⚠ RAGAS not available. Install: pip install ragas")
        return {}
    
    try:
        # Prepare dataset for RAGAS
        samples = []
        for example in eval_dataset:
            question = example["question"]
            docs = retrieve_docs(question, role, k=5)
            contexts = [doc["content"] for doc in docs]
            
            # Get actual chatbot answer for evaluation
            actual_answer = answer_question(question, role)
            
            sample = {
                "question": question,
                "answer": actual_answer,  # Actual chatbot response
                "contexts": contexts,
                "ground_truth": example["expected_answer"],  # Expected answer for comparison
            }
            samples.append(sample)
        
        # Create EvaluationDataset
        dataset = EvaluationDataset.from_dict({
            "question": [s["question"] for s in samples],
            "answer": [s["answer"] for s in samples],
            "contexts": [s["contexts"] for s in samples],
            "ground_truth": [s["ground_truth"] for s in samples],
        })
        
        # Evaluate with RAGAS metrics
        results_df = evaluate(
            dataset,
            metrics=[
                faithfulness,
                answer_relevancy,
                context_precision,
                context_recall,
            ],
            llm=llm,
        )
        
        # Calculate scores
        metrics = {
            "faithfulness": float(results_df["faithfulness"].mean()),
            "answer_relevancy": float(results_df["answer_relevancy"].mean()),
            "context_precision": float(results_df["context_precision"].mean()),
            "context_recall": float(results_df["context_recall"].mean()),
        }
        
        # Harmonic mean of all metrics
        values = list(metrics.values())
        if all(v > 0 for v in values):
            harmonic_mean = len(values) / sum(1/v for v in values)
            metrics["harmonic_mean"] = harmonic_mean
        else:
            metrics["harmonic_mean"] = 0.0
        
        return metrics
    
    except Exception as e:
        print(f"⚠ RAGAS evaluation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {}


def run_evaluation(eval_dataset: list[dict], role: str = "admin", use_llm: bool = False, use_ragas: bool = False):
    """Run evaluation on chatbot responses."""
    results = {
        "timestamp": datetime.now().isoformat(),
        "role": role,
        "total_questions": len(eval_dataset),
        "passed": 0,
        "failed": 0,
        "questions": [],
        "ragas_metrics": {} if use_ragas else None
    }
    
    llm = None
    if use_llm or use_ragas:
        llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model_name="llama-3.3-70b-versatile"
        )
    
    print(f"\n{'='*70}")
    print(f"CHATBOT EVALUATION | Role: {role} | Questions: {len(eval_dataset)}")
    print(f"{'='*70}\n")
    
    for i, example in enumerate(eval_dataset, 1):
        question = example["question"]
        expected = example["expected_answer"]
        
        try:
            # Retrieve documents for this question
            docs = retrieve_docs(question, role, k=5)
            
            # Get chatbot answer (skip if not using LLM for speed)
            if use_llm:
                actual = answer_question(question, role)
            else:
                actual = " ".join([doc["content"][:100] for doc in docs]) if docs else ""
            
            # Basic relevancy check (substring match)
            expected_lower = expected.lower()
            actual_lower = actual.lower()
            is_relevant = (
                any(chunk in actual_lower for chunk in expected_lower.split()[:3])
                or len(actual) > 50  # If answer is substantial, likely relevant
            )
            
            # Check if retrieved docs match expected context
            context_match = example["context_source"].lower() in str([d.get("filename", "") for d in docs]).lower()
            
            # Determine pass/fail (basic logic)
            question_passed = is_relevant and len(docs) > 0
            
            status = "✓ PASS" if question_passed else "✗ FAIL"
            results["passed"] += int(question_passed)
            results["failed"] += int(not question_passed)
            
            result = {
                "id": example["id"],
                "question": question,
                "expected_answer": expected,
                "actual_answer": actual[:200] + "..." if len(actual) > 200 else actual,
                "docs_retrieved": len(docs),
                "context_match": context_match,
                "answer_relevant": is_relevant,
                "status": "PASS" if question_passed else "FAIL",
            }
            
            results["questions"].append(result)
            
            # Print progress
            print(f"[{i:2d}/{len(eval_dataset)}] {status} | {question[:60]}")
            if not question_passed:
                print(f"         → Expected keywords: {expected[:80]}")
                print(f"         → Docs found: {len(docs)} | Context match: {context_match}")
            
        except Exception as e:
            print(f"[{i:2d}/{len(eval_dataset)}] ✗ ERROR | {question[:60]}")
            print(f"         → {str(e)[:100]}")
            results["questions"].append({
                "id": example["id"],
                "question": question,
                "error": str(e)[:200],
                "status": "ERROR",
            })
            results["failed"] += 1
    
    # Run RAGAS evaluation if requested
    if use_ragas and HAS_RAGAS:
        print(f"\nRunning RAGAS metrics evaluation (this will take a few minutes)...\n")
        ragas_results = _compute_ragas_metrics(eval_dataset, role, llm)
        results["ragas_metrics"] = ragas_results
        print(f"\nRAGAS METRICS:")
        print(f"  Faithfulness:       {ragas_results.get('faithfulness', 0):.3f}")
        print(f"  Answer Relevancy:   {ragas_results.get('answer_relevancy', 0):.3f}")
        print(f"  Context Precision:  {ragas_results.get('context_precision', 0):.3f}")
        print(f"  Context Recall:     {ragas_results.get('context_recall', 0):.3f}")
        print(f"  Harmonic Mean:      {ragas_results.get('harmonic_mean', 0):.3f}")
    
    # Summary stats
    pass_rate = (results["passed"] / results["total_questions"] * 100) if results["total_questions"] > 0 else 0
    print(f"\n{'='*70}")
    print(f"SUMMARY: {results['passed']}/{results['total_questions']} passed ({pass_rate:.1f}%)")
    print(f"{'='*70}\n")
    
    # Identify failure categories
    failures = [q for q in results["questions"] if q.get("status") == "FAIL"]
    if failures:
        print("FAILURE ANALYSIS (Consider adding manual examples for):\n")
        no_context = [q for q in failures if not q.get("context_match")]
        no_answer = [q for q in failures if not q.get("answer_relevant")]
        
        if no_context:
            print(f"  • Context retrieval issues ({len(no_context)} cases):")
            for q in no_context[:3]:
                print(f"    - {q['question'][:70]}")
        
        if no_answer:
            print(f"  • Answer relevancy issues ({len(no_answer)} cases):")
            for q in no_answer[:3]:
                print(f"    - {q['question'][:70]}")
        print()
    
    return results


def save_results(results: dict, output_path: str):
    """Save evaluation results to JSON."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"✓ Results saved to: {output_path}\n")


def main():
    parser = argparse.ArgumentParser(description="Evaluate RAG chatbot")
    parser.add_argument(
        "--role",
        default="c_level",
        choices=["admin", "c_level", "finance", "hr", "engineer", "sales", "marketing", "general"],
        help="User role to evaluate (tests RBAC)"
    )
    parser.add_argument(
        "--output",
        default="eval_results.json",
        help="Output JSON file for results"
    )
    parser.add_argument(
        "--dataset",
        default="resources/ragas_eval_set_full.csv",
        help="Path to evaluation dataset CSV"
    )
    parser.add_argument(
        "--llm",
        action="store_true",
        help="Use actual LLM for answers (slower but more realistic)"
    )
    parser.add_argument(
        "--ragas",
        action="store_true",
        help="Compute RAGAS metrics (faithfulness, relevancy, etc.)"
    )
    
    args = parser.parse_args()
    
    # Load dataset
    csv_path = args.dataset
    if not os.path.exists(csv_path):
        print(f"❌ Dataset not found: {csv_path}")
        sys.exit(1)
    
    eval_dataset = load_eval_dataset(csv_path)
    print(f"✓ Loaded {len(eval_dataset)} evaluation examples from {csv_path}")
    
    if args.ragas and not HAS_RAGAS:
        print("⚠ RAGAS not installed. Install with: pip install ragas")
    
    # Run evaluation
    results = run_evaluation(eval_dataset, role=args.role, use_llm=args.llm, use_ragas=args.ragas)
    
    # Save results
    save_results(results, args.output)


if __name__ == "__main__":
    main()
