

ROLE_PERMISSIONS = {
    "finance": ["finance", "marketing", "general"],
    "hr": ["hr", "general"],
    "c_level": ["finance", "hr", "marketing", "engineering", "sales", "general"],
    "engineer": ["engineering", "general"],
    "sales": ["sales", "marketing", "general"],
    "general": ["general"],
}

USER_ROLES = {
    "alice": "finance",
    "bob": "hr",
    "carol": "c_level",
    "eve": "engineer",
    "sam": "sales",
    "guest": "general",
}

def get_user_role(user_id: str) -> str:
    return USER_ROLES.get(user_id, "general")

def has_access(role: str, doc_type: str) -> bool:
    return doc_type in ROLE_PERMISSIONS.get(role, [])
