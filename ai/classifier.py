import os
import json
import google.generativeai as genai

# Valid values for validation
CATEGORIES = ["MEDICAL", "FOOD", "SHELTER", "MISSING_PERSON", "SAFETY"]
PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
RESOURCES = ["AMBULANCE", "MEDICAL_KIT", "FOOD_PACKETS", "RESCUE_TEAMS", "SHELTER_SPACE"]

def _load_api_key() -> str:
    """Load Gemini API key from environment or .env files."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return api_key

    for path in ["../backend/.env", ".env", "ai/.env", "backend/.env"]:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    for line in f:
                        if line.startswith("GEMINI_API_KEY="):
                            return line.split("=", 1)[1].strip().strip('"').strip("'")
            except Exception:
                pass
    return ""

def classify_emergency(text: str) -> dict:
    """
    Classify an emergency message using Google Gemini AI.
    Returns category, priority, resourceNeeded, and reason.
    """
    api_key = _load_api_key()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured. Cannot classify without Gemini.")

    # Configure the SDK
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = (
        f"You are an AI disaster coordination agent. Analyze this emergency message: '{text}'.\n\n"
        "Classify it into one of these exact categories: MEDICAL, FOOD, SHELTER, MISSING_PERSON, SAFETY.\n"
        "Evaluate its urgency level as one of these exact priorities: CRITICAL, HIGH, MEDIUM, LOW.\n"
        "Determine the primary resource required from this exact list: AMBULANCE, MEDICAL_KIT, FOOD_PACKETS, RESCUE_TEAMS, SHELTER_SPACE.\n"
        "Provide a brief, professional reasoning for your choices.\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. If the message is a greeting (e.g. 'hello', 'hi'), conversational banter, or does NOT describe a real emergency, "
        "you MUST set the priority to LOW, the category to MEDICAL, and the resourceNeeded to MEDICAL_KIT.\n"
        "2. Your response must be strictly in JSON format. Do not wrap the JSON in ```json or any other formatting. "
        "Use this exact schema:\n"
        "{\n"
        '  "category": "string",\n'
        '  "priority": "string",\n'
        '  "resourceNeeded": "string",\n'
        '  "reason": "string"\n'
        "}"
    )

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )

        result = json.loads(response.text.strip())

        # Validate and sanitize the response
        category = result.get("category", "MEDICAL").upper()
        priority = result.get("priority", "LOW").upper()
        resource = result.get("resourceNeeded", "MEDICAL_KIT").upper()
        reason = result.get("reason", "Analyzed by Gemini AI agent.")

        if category not in CATEGORIES:
            category = "MEDICAL"
        if priority not in PRIORITIES:
            priority = "LOW"
        if resource not in RESOURCES:
            resource = "MEDICAL_KIT"

        print(f"[Gemini Agent] '{text}' → Category: {category}, Priority: {priority}, Resource: {resource}")

        return {
            "category": category,
            "priority": priority,
            "resourceNeeded": resource,
            "reason": reason
        }

    except Exception as e:
        print(f"[Gemini Agent] Error: {e}")
        raise RuntimeError(f"Gemini classification failed: {str(e)}")
