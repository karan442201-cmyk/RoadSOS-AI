from math import asin, cos, radians, sin, sqrt


def distance_km(origin: dict, service: dict) -> float:
    lat1, lon1 = radians(origin["lat"]), radians(origin["lng"])
    lat2, lon2 = radians(service["lat"]), radians(service["lng"])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return round(6371 * 2 * asin(sqrt(a)), 2)


def rank_services(origin: dict, services: list[dict], service_type: str | None = None) -> list[dict]:
    filtered = [item for item in services if service_type in (None, item["type"])]
    ranked = []
    for item in filtered:
        distance = distance_km(origin, item)
        eta = max(3, round(distance / 0.55))
        ranked.append({**item, "distance_km": distance, "eta_min": eta})
    return sorted(ranked, key=lambda item: (item["distance_km"], -int(item.get("available", True))))


def build_emergency_plan(origin: dict, services: list[dict]) -> dict:
    hospitals = rank_services(origin, services, "hospital")
    ambulances = rank_services(origin, services, "ambulance")
    police = rank_services(origin, services, "police")

    primary_ambulance = next((item for item in ambulances if item.get("available", True)), None)
    nearest_hospital = hospitals[0] if hospitals else None

    fallback = []
    if not primary_ambulance:
        fallback.extend(
            [
                "Call 108 or 112 immediately.",
                "Ask a bystander to arrange a cab or private vehicle to the nearest trauma-ready hospital.",
                "Inform the nearest police station for traffic control and crash reporting.",
            ]
        )

    return {
        "primary_ambulance": primary_ambulance,
        "nearest_hospital": nearest_hospital,
        "nearest_police": police[0] if police else None,
        "fallback_steps": fallback,
        "instructions": [
            "Keep yourself visible and away from traffic.",
            "Do not remove a helmet unless breathing is blocked.",
            "Apply firm pressure on bleeding with clean cloth.",
            "Do not give food or water to an unconscious person.",
        ],
    }

