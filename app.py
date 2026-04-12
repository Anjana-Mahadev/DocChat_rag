
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# FastAPI app instance must be defined before any route decorators
app = FastAPI()

# Allow all origins for development (customize for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User

# SQLite DB setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# JWT/auth imports
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
# JWT settings
SECRET_KEY = "supersecretkey"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_user_by_username(db, username):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db, username, password):
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Registration request model
class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str

@app.post("/register")
def register(request: RegisterRequest, db: SessionLocal = Depends(get_db)):
    if get_user_by_username(db, request.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    user = User(
        username=request.username,
        hashed_password=pwd_context.hash(request.password),
        role=request.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"msg": "User registered successfully"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: SessionLocal = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: SessionLocal = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        user = get_user_by_username(db, username)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

load_dotenv()
from rag.rag_pipeline import answer_question
from rag.rbac import get_user_role
from rag.guardrails import check_guardrails

class QueryRequest(BaseModel):
    question: str

# Protected query endpoint
@app.post("/query")
async def query(request: QueryRequest, current_user: User = Depends(get_current_user)):
    role = current_user.role
    guardrail_result = check_guardrails(request.question, role)
    if not guardrail_result["allowed"]:
        raise HTTPException(status_code=403, detail=guardrail_result["reason"])
    answer = answer_question(request.question, role)
    return {"answer": answer}
