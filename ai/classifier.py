import re
import os
import json
import requests

CATEGORIES = ["MEDICAL", "FOOD", "SHELTER", "MISSING_PERSON", "SAFETY"]
PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
RESOURCES = {
    "MEDICAL": {"CRITICAL": "AMBULANCE", "HIGH": "AMBULANCE", "MEDIUM": "MEDICAL_KIT", "LOW": "MEDICAL_KIT"},
    "FOOD": {"CRITICAL": "FOOD_PACKETS", "HIGH": "FOOD_PACKETS", "MEDIUM": "FOOD_PACKETS", "LOW": "FOOD_PACKETS"},
    "SHELTER": {"CRITICAL": "SHELTER_SPACE", "HIGH": "SHELTER_SPACE", "MEDIUM": "SHELTER_SPACE", "LOW": "SHELTER_SPACE"},
    "MISSING_PERSON": {"CRITICAL": "RESCUE_TEAMS", "HIGH": "RESCUE_TEAMS", "MEDIUM": "RESCUE_TEAMS", "LOW": "RESCUE_TEAMS"},
    "SAFETY": {"CRITICAL": "RESCUE_TEAMS", "HIGH": "RESCUE_TEAMS", "MEDIUM": "RESCUE_TEAMS", "LOW": "RESCUE_TEAMS"}
}

def classify_emergency(text: str) -> dict:
    # Try using Gemini API first
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Try to parse from ../backend/.env or .env or ai/.env
        for path in ["../backend/.env", ".env", "ai/.env", "backend/.env"]:
            if os.path.exists(path):
                try:
                    with open(path, "r") as f:
                        for line in f:
                            if line.startswith("GEMINI_API_KEY="):
                                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                                break
                except Exception:
                    pass
            if api_key:
                break

    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            prompt = (
                f"You are an AI disaster coordination agent. Analyze this emergency message text: '{text}'.\n\n"
                "Classify it into one of these exact categories: MEDICAL, FOOD, SHELTER, MISSING_PERSON, SAFETY.\n"
                "Evaluate its urgency level as one of these exact priorities: CRITICAL, HIGH, MEDIUM, LOW.\n"
                "Determine the primary resource required from this exact list: AMBULANCE, MEDICAL_KIT, FOOD_PACKETS, RESCUE_TEAMS, SHELTER_SPACE.\n"
                "Provide a brief, professional reasoning for your choices.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. If the message text is a greeting (e.g. 'hello', 'hi'), conversational banter, or does NOT describe an emergency, "
                "you MUST set the priority to LOW, the category to the closest match (e.g. MEDICAL), and the resourceNeeded to MEDICAL_KIT.\n"
                "2. Your response must be strictly in JSON format. Do not wrap the JSON in ```json or any other formatting text. "
                "Use this exact schema:\n"
                "{\n"
                '  "category": "string",\n'
                '  "priority": "string",\n'
                '  "resourceNeeded": "string",\n'
                '  "reason": "string"\n'
                "}"
            )
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            response = requests.post(url, headers=headers, json=payload, timeout=8)
            if response.status_code == 200:
                data = response.json()
                text_response = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                result = json.loads(text_response)
                
                category = result.get("category", "MEDICAL").upper()
                priority = result.get("priority", "LOW").upper()
                resource = result.get("resourceNeeded", "MEDICAL_KIT").upper()
                reason = result.get("reason", "Analyzed using Gemini API.")
                
                if category not in CATEGORIES:
                    category = "MEDICAL"
                if priority not in PRIORITIES:
                    priority = "LOW"
                if resource not in ["AMBULANCE", "MEDICAL_KIT", "FOOD_PACKETS", "RESCUE_TEAMS", "SHELTER_SPACE"]:
                    resource = "MEDICAL_KIT"
                    
                print(f"[Gemini Agent] Successfully analyzed: '{text}' -> Category: {category}, Priority: {priority}, Resource: {resource}")
                return {
                    "category": category,
                    "priority": priority,
                    "resourceNeeded": resource,
                    "reason": reason
                }
            else:
                print(f"[Gemini Agent] API returned status {response.status_code}. Falling back to local classifier.")
        except Exception as e:
            print(f"[Gemini Agent] Error calling Gemini API: {str(e)}. Falling back to local classifier.")

    # Fallback keyword classifier if no API key or call fails
    print(f"[Local Agent] Running keyword classifier fallback for: '{text}'")
    text_lower = text.lower()
    
    # Category matches (count keyword occurrences)
    keywords = {
        "MEDICAL": ["bleed", "bleeding", "doctor", "hospital", "wound", "injured", "injury", "broken", "pain", "heart", "breath", "breathing", "medic", "ambulance", "cut", "blood", "medical", "doctor"],
        "FOOD": ["food", "water", "hungry", "starve", "starving", "dehydrated", "dehydration", "drink", "ration", "rations", "supplies", "eat", "meal"],
        "SHELTER": ["shelter", "house", "storm", "cold", "freezing", "roof", "sleeping", "stay", "home", "building", "weather"],
        "MISSING_PERSON": ["child", "lost", "missing", "find", "husband", "wife", "kid", "kids", "family", "search", "trapped", "rubble", "collapse"],
        "SAFETY": ["fire", "smoke", "flood", "thief", "looting", "collapse", "danger", "hazard", "threat", "alert", "warning", "police", "security"]
    }
    
    category_scores = {cat: 0 for cat in CATEGORIES}
    for cat, kw_list in keywords.items():
        for kw in kw_list:
            matches = len(re.findall(r'\b' + re.escape(kw) + r'\b', text_lower))
            category_scores[cat] += matches
            
    max_cat = max(category_scores, key=category_scores.get)
    if category_scores[max_cat] == 0:
        if "help" in text_lower or "please" in text_lower:
            max_cat = "MEDICAL"
        else:
            sub_scores = {cat: 0 for cat in CATEGORIES}
            for cat, kw_list in keywords.items():
                for kw in kw_list:
                    if kw in text_lower:
                        sub_scores[cat] += 1
            max_sub_cat = max(sub_scores, key=sub_scores.get)
            if sub_scores[max_sub_cat] > 0:
                max_cat = max_sub_cat
            else:
                max_cat = "MEDICAL"

    # Priority matches
    critical_triggers = [
        "bleed badly", "bleeding badly", "bleeding heavily", "unconscious", "not breathing",
        "heart attack", "trapped under", "rubble", "drowning", "trapped in fire", "dying", "critical"
    ]
    high_triggers = [
        "injured", "broken bone", "severe pain", "no water", "freezing", "looting", "fire",
        "bleeding", "severe", "hurt", "danger"
    ]
    medium_triggers = [
        "need food", "need water", "need shelter", "lost", "missing", "supplies", "hungry"
    ]
    
    priority = "LOW"
    reason = "Standard priority emergency request."
    
    if any(trigger in text_lower for trigger in critical_triggers):
        priority = "CRITICAL"
        reason = "Message contains life-threatening or immediate critical keywords."
    elif any(trigger in text_lower for trigger in high_triggers):
        priority = "HIGH"
        reason = "Message indicates severe injury, immediate safety risks, or exposure issues."
    elif any(trigger in text_lower for trigger in medium_triggers):
        priority = "MEDIUM"
        reason = "Message requests basic survival provisions (food, shelter) or missing person search."
    elif "small food problem" in text_lower or "scratched" in text_lower or "low" in text_lower or "hello" in text_lower or "hi" in text_lower or text_lower.strip() in ["hello", "hi", "hey"]:
        priority = "LOW"
        reason = "Message indicates a greeting or minor non-urgent issue."
    else:
        # Fallback keyword logic
        if max_cat == "MEDICAL":
            priority = "HIGH"
            reason = "Classified as MEDICAL category, treated as high priority by default."
        elif max_cat in ["SHELTER", "SAFETY"]:
            priority = "MEDIUM"
            reason = f"Classified as {max_cat}, requiring timely but non-critical intervention."
        else:
            priority = "LOW"
            reason = "Standard request, no high-priority keywords detected."

    resource = RESOURCES[max_cat][priority]
    
    return {
        "category": max_cat,
        "priority": priority,
        "resourceNeeded": resource,
        "reason": reason
    }

