# Guardrails: PII detection, out-of-scope detection
import re

def check_guardrails(question: str, role: str) -> dict:
    # Cuss word filtering (basic)
    cuss_words = [
        "fuck", "shit", "bitch", "asshole", "bastard", "dick", "piss", "crap", "damn", "cunt", "prick", "slut", "whore"
    ]
    lowered = question.lower()
    for word in cuss_words:
        if word in lowered:
            return {"allowed": False, "reason": "Profanity detected in question."}
    # Simple PII detection (email, phone, ssn)
    pii_patterns = [
        r"[\w\.-]+@[\w\.-]+",  # email
        r"\b\d{3}[-.]?\d{2}[-.]?\d{4}\b",  # ssn
        r"\b\d{10}\b",  # phone
    ]
    for pat in pii_patterns:
        if re.search(pat, question):
            return {"allowed": False, "reason": "PII detected in question."}
    # Out-of-scope detection (customize as needed)
    if "joke" in question.lower() or "weather" in question.lower():
        return {"allowed": False, "reason": "Out-of-scope question."}
    return {"allowed": True}
