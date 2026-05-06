from dataclasses import dataclass


@dataclass(frozen=True)
class IntentResult:
    intent: str
    urgency: str
    confidence: float
    actions: list[str]
    reply: str


EMERGENCY_WORDS = {
    "accident",
    "ambulance",
    "bleeding",
    "crash",
    "emergency",
    "fracture",
    "hit",
    "injured",
    "unconscious",
}

SERVICE_WORDS = {
    "hospital",
    "trauma",
    "police",
    "station",
    "nearest",
    "nearby",
    "route",
}

SAFETY_WORDS = {
    "first aid",
    "first-aid",
    "helmet",
    "safety",
    "checklist",
    "what to do",
}


def classify_message(message: str) -> IntentResult:
    text = message.strip().lower()
    emergency_hits = sum(word in text for word in EMERGENCY_WORDS)
    service_hits = sum(word in text for word in SERVICE_WORDS)
    safety_hits = sum(word in text for word in SAFETY_WORDS)

    if emergency_hits:
        urgency = "critical" if emergency_hits >= 2 or "unconscious" in text else "high"
        return IntentResult(
            intent="emergency",
            urgency=urgency,
            confidence=min(0.98, 0.68 + emergency_hits * 0.1 + service_hits * 0.04),
            actions=["share_location", "show_services", "prepare_sos", "first_aid"],
            reply=(
                "I detected a road emergency. Move to a safe spot if possible, call 108 or 112, "
                "share your location, and avoid moving injured people unless there is immediate danger."
            ),
        )

    if service_hits:
        return IntentResult(
            intent="service_lookup",
            urgency="medium",
            confidence=min(0.9, 0.58 + service_hits * 0.09),
            actions=["share_location", "show_services"],
            reply="I can help find nearby hospitals, trauma centers, ambulances, and police stations.",
        )

    if safety_hits:
        return IntentResult(
            intent="road_safety_info",
            urgency="low",
            confidence=min(0.86, 0.56 + safety_hits * 0.1),
            actions=["show_safety_guidance"],
            reply="Here are safe accident-response steps: secure the scene, call emergency services, check breathing, control bleeding, and stay visible.",
        )

    return IntentResult(
        intent="general",
        urgency="low",
        confidence=0.42,
        actions=["chat"],
        reply="Tell me what happened or ask for ambulance, trauma center, police, first aid, or road safety help.",
    )

