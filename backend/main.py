import os
import io
import json
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google.generativeai import GenerativeModel
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# --- Environment and API Setup ---
load_dotenv()
app = FastAPI()

# Configure APIs
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = GenerativeModel('gemini-pro')
supabase: Client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

# --- Constants ---
# A single, stable UUID for Maryanne's profile row.
# This ensures we always update the same record.
USER_PROFILE_ID = "a6e8a5e5-71c2-4a4c-8e8a-5e5a6e8a5e5a" 

# --- Pydantic Models ---
class ProfileData(BaseModel):
    fullName: str | None = None
    professionalTitle: str | None = None
    skills: str | None = None
    lastRole: str | None = None
    education: str | None = None

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    chat_history: list[ChatMessage]

class JobRequest(BaseModel):
    job_description: str

class PDFRequest(BaseModel):
    text: str

# --- Prompts ---
CHAT_SYSTEM_PROMPT = """You are a friendly and expert career advisor, 'AI Career Co-pilot', having a conversation with a user named Maryanne Njenga. Your primary goal is to strategically and naturally gather her professional information to build her profile. 

1.  **Analyze the chat history** to understand what you have already asked and what information she has provided.
2.  **Identify the next logical piece of information needed** (e.g., if you have her name, ask for her title). The required fields are: fullName, professionalTitle, skills, lastRole, and education.
3.  **Formulate a friendly, conversational question** to ask for that information. Do not ask for everything at once.
4.  **After you ask the question, you MUST return a JSON object** containing the updated profile and your response. The JSON should look like this: {"response": "Your conversational question here.", "updated_profile": {"fullName": "...", "professionalTitle": "...", ...}}
5.  **If the user's last message contains information, extract it** and include it in the `updated_profile` part of your JSON response. 
6.  **Once all five fields are filled**, your final response should be a concluding message like, "Great, I have everything I need. Please paste the job description below so we can get started on your application!" and set the `profile_complete` flag to true in the JSON.
"""

GENERATION_SYSTEM_PROMPT = """You are an expert career advisor specializing in crafting compelling and human-sounding resumes and cover letters in British English for a user named Maryanne Njenga. Your goal is to generate professional documents that highlight the user's skills, experience, and suitability for a given role. Avoid overly formal or robotic language and focus on showcasing accomplishments and quantifiable results. Write in a conversational and confident tone. Use correct British English spelling and grammar (e.g., 'organise', 'analyse', 'CV'). Generate the document as a single block of formatted text. Do not include any introductory text like 'Here is the CV:' or 'Here is the generated cover letter.'."""

# --- Helper Functions ---
async def get_user_profile() -> ProfileData:
    """Fetches and returns the user's profile from Supabase."""
    try:
        response = supabase.table('user_profile').select('profile_data').eq('id', USER_PROFILE_ID).single().execute()
        if response.data:
            return ProfileData(**response.data['profile_data'])
        else:
            return ProfileData() # Return empty profile if not found
    except Exception as e:
        print(f"Error fetching profile from Supabase: {e}")
        return ProfileData() # Return empty profile on error

def generate_document_content(profile: ProfileData, job_description: str, task: str) -> str:
    """Generates document content using the Gemini API."""
    user_profile_text = f"USER PROFILE:\nFull Name: {profile.fullName}\nProfessional Title: {profile.professionalTitle}\nSkills: {profile.skills}\nLast Role: {profile.lastRole}\nEducation: {profile.education}"
    full_prompt = f"{GENERATION_SYSTEM_PROMPT}\n\n{user_profile_text}\n\nJOB DESCRIPTION:\n{job_description}\n\nTASK: {task}"
    try:
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        print(f"Error generating content from Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate content from AI.")

# --- API Endpoints ---
@app.post("/api/chat")
async def chat(request: ChatRequest = Body(...)):
    # If chat history is empty, try to load existing profile and start conversation
    if not request.chat_history:
        existing_profile = await get_user_profile()
        if existing_profile.fullName: # Check if profile has at least a name
            return {"response": "Welcome back! Please paste the job description below to get started.", "updated_profile": existing_profile.dict(), "profile_complete": True}
        else:
            # Initial question if no profile exists
            initial_question_prompt = CHAT_SYSTEM_PROMPT + "\n\nChat History:\nbot: Hello Maryanne, let's get your profile ready. What is your full name?\n"
            try:
                response = model.generate_content(initial_question_prompt)
                chat_response = json.loads(response.text)
                return chat_response
            except Exception as e:
                print(f"Error generating initial chat response: {e}")
                return {"response": "Hello Maryanne, I'm ready to help! What is your full name?", "updated_profile": {}, "profile_complete": False}

    prompt = CHAT_SYSTEM_PROMPT + "\n\nChat History:\n"
    for msg in request.chat_history:
        prompt += f"{msg.sender}: {msg.text}\n" 
    
    try:
        response = model.generate_content(prompt)
        chat_response = json.loads(response.text)
        profile_data = chat_response.get("updated_profile", {})
        
        if profile_data:
            try:
                supabase.table('user_profile').upsert({"id": USER_PROFILE_ID, "profile_data": profile_data.dict()}).execute()
            except Exception as e:
                print(f"Error upserting profile to Supabase: {e}")
                # Continue without crashing if Supabase fails
            
        return chat_response
    except (json.JSONDecodeError, AttributeError) as e:
        print(f"Error processing chat response from Gemini: {e}")
        return {"response": "I apologize, I had a little trouble understanding that. Could you please rephrase?", "updated_profile": {}, "profile_complete": False}

@app.post("/api/generate-cv")
async def generate_cv(request: JobRequest = Body(...)):
    profile = await get_user_profile()
    if not profile.fullName: # Basic check if profile is empty
        raise HTTPException(status_code=400, detail="User profile is incomplete. Please complete your profile first.")
    content = generate_document_content(profile, request.job_description, "Generate a CV.")
    # Storing the job and draft is a good feature, but let's keep it simple for now.
    # job_id = supabase.table('jobs').insert({"job_description": request.job_description}).execute().data[0]['id']
    # supabase.table('cv_drafts').insert({'content_text': content, 'job_id': job_id}).execute()
    return {"content": content}

@app.post("/api/generate-cover-letter")
async def generate_cover_letter(request: JobRequest = Body(...)):
    profile = await get_user_profile()
    if not profile.fullName: # Basic check if profile is empty
        raise HTTPException(status_code=400, detail="User profile is incomplete. Please complete your profile first.")
    content = generate_document_content(profile, request.job_description, "Generate a Cover Letter.")
    return {"content": content}

@app.post("/generate_pdf")
async def generate_pdf(request: PDFRequest = Body(...)):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter, title="Generated Document")
    
    # Set up text object for multi-line text
    text_object = c.beginText(40, 780) # Start lower to account for title/margins
    text_object.setFont("Helvetica", 10)
    
    # Simple line breaking (can be improved for word wrap)
    lines = request.text.split('\n')
    for line in lines:
        text_object.textLine(line)
        
    c.drawText(text_object)
    c.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment;filename=document.pdf"})