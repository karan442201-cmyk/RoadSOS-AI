from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class ChatRequest(BaseModel):
    message: str
    location: Location | None = None


class SosRequest(BaseModel):
    name: str = "Anonymous"
    phone: str = ""
    message: str = "Road emergency"
    location: Location

