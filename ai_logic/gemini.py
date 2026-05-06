import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def generate_ai_reply(message: str, urgency: str) -> str | None:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
    prompt = (
        "You are RoadSOS AI, a road accident emergency assistant for India. "
        "Give short, practical, safety-first guidance. Tell the user to call 108 or 112 "
        "for emergencies. Do not invent live hospital availability. "
        f"Urgency: {urgency}. User message: {message}"
    )
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
    request = Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError):
        return None

    candidates = payload.get("candidates", [])
    if not candidates:
        return None

    parts = candidates[0].get("content", {}).get("parts", [])
    text = " ".join(part.get("text", "") for part in parts).strip()
    return text or None
