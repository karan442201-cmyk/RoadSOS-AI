# RoadSOS AI

RoadSOS AI is an AI-powered road safety and emergency assistance web application built for the IIT Madras Road Safety Hackathon 2026.

Live demo: https://roadsos-ai.onrender.com/

## Overview

RoadSOS AI helps users during road emergencies by combining an emergency assistant, SOS flow, nearby service discovery, first-aid guidance, GPS/manual location support, and no-billing map routing.

When a user reports an accident, the system can:

- Detect emergency intent and urgency
- Suggest immediate safety actions
- Show nearby ambulance, hospital, and police options
- Generate an SOS dispatch response
- Use device GPS or manual coordinates
- Provide Google Maps and OpenStreetMap route links
- Continue working with offline/browser fallback logic

## Key Features

- AI emergency assistant with backend intent detection
- One-click SOS alert workflow
- Device GPS location support
- Manual latitude/longitude location entry
- Nearby emergency services ranking
- Ambulance, hospital, and police cards
- No Google Cloud billing required for maps
- OpenStreetMap embedded route view
- Google Maps direction links without API billing
- Offline emergency guidance fallback
- FastAPI backend with clean API endpoints
- Optional Gemini API integration

## Live Demo

Open:

```text
https://roadsos-ai.onrender.com/
```

Suggested demo flow:

1. Open the app.
2. Click `Use device GPS` or set location manually.
3. Type `Road accident near me`.
4. The assistant classifies the request as an emergency.
5. Nearby emergency services are shown.
6. Click `SOS`.
7. Open a route link from a service card.

## Tech Stack

Frontend:

- HTML
- CSS
- JavaScript
- OpenStreetMap embed

Backend:

- Python
- FastAPI
- Pydantic
- Uvicorn

AI / Logic:

- Rule-based emergency intent detection
- Smart emergency routing logic
- Optional Gemini API response generation

Deployment:

- Render
- Docker-ready configuration

## Project Structure

```text
RoadSOS-AI/
├── ai_logic/
│   ├── gemini.py
│   ├── intent.py
│   └── routing.py
├── backend/
│   ├── api.py
│   ├── models.py
│   └── sample_data.py
├── database/
│   └── schema.sql
├── docs/
│   └── team-division.md
├── frontend/
│   ├── app.js
│   ├── index.html
│   ├── styles.css
│   └── sw.js
├── app.py
├── Dockerfile
├── Procfile
├── render.yaml
└── requirements.txt
```

## Run Locally

Clone the repository and run:

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

Open:

```text
http://127.0.0.1:8000/
```

Device GPS works best from `http://127.0.0.1:8000/` because browsers may restrict location permission on `file://` pages.

## API Endpoints

Health check:

```http
GET /health
```

Chat assistant:

```http
POST /chat
```

Example body:

```json
{
  "message": "Road accident near me need ambulance",
  "location": {
    "lat": 13.0067,
    "lng": 80.2206
  }
}
```

Create SOS:

```http
POST /sos
```

Example body:

```json
{
  "name": "RoadSOS demo user",
  "phone": "",
  "message": "SOS from RoadSOS AI web app",
  "location": {
    "lat": 13.0067,
    "lng": 80.2206
  }
}
```

Nearby services:

```http
GET /services/nearby?lat=13.0067&lng=80.2206
```

## Optional Gemini Setup

The app works without a Gemini API key using its built-in RoadSOS rules engine.

To enable Gemini-powered responses, set these environment variables:

```text
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

On Render, add them under `Environment Variables`.

## Billing-Free Map Mode

This project intentionally avoids Google Cloud billing requirements.

It uses:

- OpenStreetMap embed for the map view
- Google Maps route links through `https://www.google.com/maps/dir/?api=1`
- OpenStreetMap route links through `https://www.openstreetmap.org/directions`

This means no Google Maps Platform API key or billing account is required for the current map feature.

Note: live Google Places search is not included in this billing-free mode. Nearby emergency services currently come from backend sample/cache data.

## Deployment

This project is deployed as one Render web service. FastAPI serves both the API and the frontend.

Render settings:

```text
Environment: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

Optional environment variables:

```text
GEMINI_MODEL=gemini-2.0-flash
GEMINI_API_KEY=your_key_here
```

## Hackathon Requirements Covered

| Requirement | Status |
| --- | --- |
| AI chatbot | Covered |
| Road safety assistance | Covered |
| Emergency SOS flow | Covered |
| Nearby hospitals/services | Covered |
| Ambulance routing fallback | Covered |
| GPS/manual location | Covered |
| Offline fallback guidance | Covered |
| Python backend | Covered |
| Maps/routing | Covered without billing |

## Future Improvements

- Real SMS/WhatsApp SOS alerts
- Emergency contact management
- Responder dashboard
- Live ambulance tracking
- Regional language support
- Voice input
- Severity questionnaire
- SQLite persistence for SOS logs
- Real hospital availability integration

## Disclaimer

RoadSOS AI is a hackathon prototype. It is not a substitute for official emergency services. In a real emergency in India, call `108` or `112` immediately.
