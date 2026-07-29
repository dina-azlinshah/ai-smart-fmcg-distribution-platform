import os
try:
    import google.generativeai as genai
except ImportError:
    genai = None
from pydantic import BaseModel
from dotenv import load_dotenv
import database as db
import json
import re

# File initializes here

def get_schema_context():
    # Dynamically fetch the complete database schema to cover all tables
    return db.get_db_schema()

def extract_sql_from_markdown(text):
    """Extracts raw SQL from an LLM markdown response."""
    match = re.search(r"```(?:sql)?\n?(.*?)\n?```", text, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()
    return text.strip()

def process_query(user_message: str) -> str:
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key or api_key == "YOUR_ACTUAL_KEY_HERE":
        return "⚠️ Gemini API Key not found. Please add your key to the .env file and try again!"
        
    try:
        client = genai.Client(api_key=api_key)
        
        # STEP 1: Text-to-SQL Generation
        sql_prompt = f"""
{get_schema_context()}

A user asked: "{user_message}"

Write an exact, accurate MS SQL Server `SELECT` query to answer this question mathematically.
If the question is completely unrelated to the data model, return EXACTLY the string: "NO_SQL".
Otherwise, return ONLY the raw SQL query. Do not explain anything. 
Example response: 
SELECT TOP 1 DebtorName, SUM(NetTotal) FROM IV WHERE Cancelled = 'F' GROUP BY DebtorName ORDER BY SUM(NetTotal) DESC
"""
        sql_response = client.models.generate_content(model="gemini-1.5-flash", contents=sql_prompt).text
        sql_string = extract_sql_from_markdown(sql_response)
        
        if sql_string == "NO_SQL":
            # Just answer normally if it doesn't need SQL
            normal_prompt = f"""You are an FMCG Sales Dashboard AI Assistant. The user asks: "{user_message}". Be brief and professional."""
            return client.models.generate_content(model="gemini-1.5-flash", contents=normal_prompt).text

        # STEP 2: Execute SQL Natively
        db_results = db.execute_ai_query(sql_string)
        
        # STEP 3: Synthesis Generation
        synthesis_prompt = f"""
The user asked: "{user_message}"

You generated and ran this SQL: {sql_string}

The database returned this raw JSON data output:
{json.dumps(db_results, indent=2)}

Synthesize a friendly, very conversational answer for the user summarizing this data. Be precise and use output formatting like currencies (MYR). 
Do NOT show them the raw SQL query. Answer exactly what they asked based solely on the data.
"""
        final_answer = client.models.generate_content(model="gemini-1.5-flash", contents=synthesis_prompt).text
        return final_answer

    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return "⏳ I'm currently receiving too many requests due to quota limits. Please wait about 15 seconds and try asking me again!"
        return f"Error executing AI query logic: {error_msg}"
