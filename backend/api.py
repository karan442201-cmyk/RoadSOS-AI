from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from ai_logic.gemini import generate_ai_reply
from ai_logic.intent import classify_message
from ai_logic.routing import build_emergency_plan, rank_services
from backend.models import ChatRequest, SosRequest
from backend.sample_data import EMERGENCY_SERVICES

app = FastAPI(title="RoadSOS AI", version="0.1.0")
PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
def home() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/app.js")
def frontend_script() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "app.js", media_type="application/javascript")


@app.get("/styles.css")
def frontend_styles() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "styles.css", media_type="text/css")


@app.get("/sw.js")
def service_worker() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "sw.js", media_type="application/javascript")


@app.get("/favicon.ico")
def favicon() -> Response:
    return Response(status_code=204)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "RoadSOS AI"}


@app.post("/chat")
def chat(payload: ChatRequest) -> dict:
    result = classify_message(payload.message)
    ai_reply = generate_ai_reply(payload.message, result.urgency)
    response = {
        "intent": result.intent,
        "urgency": result.urgency,
        "confidence": result.confidence,
        "actions": result.actions,
        "reply": ai_reply or result.reply,
        "source": "gemini" if ai_reply else "roadsos_rules_engine",
    }
    if payload.location and "show_services" in result.actions:
        origin = payload.location.model_dump()
        response["plan"] = build_emergency_plan(origin, EMERGENCY_SERVICES)
        response["services"] = rank_services(origin, EMERGENCY_SERVICES)
    return response


@app.post("/sos")
def create_sos(payload: SosRequest) -> dict:
    origin = payload.location.model_dump()
    plan = build_emergency_plan(origin, EMERGENCY_SERVICES)
    return {
        "status": "created",
        "sos_id": f"SOS-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "message": payload.message,
        "location": origin,
        "dispatch_plan": plan,
    }


@app.get("/services/nearby")
def nearby_services(lat: float, lng: float, type: str | None = None) -> dict:
    return {"services": rank_services({"lat": lat, "lng": lng}, EMERGENCY_SERVICES, type)}
