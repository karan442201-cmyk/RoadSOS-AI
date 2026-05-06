# RoadSOS AI

AI-powered road safety and emergency assistance MVP for the IIT Madras Road Safety Hackathon 2026.

## What Is Included

- Mobile-first emergency dashboard
- Offline-capable AI assistant fallback
- Emergency intent and urgency detection
- Nearby hospital, ambulance, and police service ranking
- Smart fallback routing when ambulance availability is low
- SOS logging API scaffold
- First-aid and road-safety information
- Billing-free OpenStreetMap route view

## Run Locally

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

Open:

```text
http://127.0.0.1:8000/
```

Device GPS works best from `http://127.0.0.1:8000/` because browsers may restrict location permission on `file://` pages.

## Optional AI Key

The backend works without external keys using the RoadSOS rules engine. For Gemini-powered responses, set:

```bash
set GEMINI_API_KEY=YOUR_KEY
set GEMINI_MODEL=gemini-2.0-flash
```

## Billing-Free Map Mode

The web app uses OpenStreetMap embed for the route view and generates external direction links:

- Google Maps route links through `https://www.google.com/maps/dir/?api=1`
- OpenStreetMap route links through `https://www.openstreetmap.org/directions`

This does not require a Google Cloud billing account. Live Google Places search is not included in this mode, so nearby emergency services come from the backend sample/cache list.

## API Endpoints

- `GET /health`
- `POST /chat`
- `POST /sos`
- `GET /services/nearby?lat=13.0067&lng=80.2206&type=hospital`

## Permanent Deployment

The simplest deployment is one web service because FastAPI serves both the backend API and `frontend/`.

### Render

1. Push this `RoadSOS-AI` folder to GitHub.
2. Create a new Render Web Service from the repo.
3. Use these settings:

```text
Environment: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

4. Optional environment variables:

```text
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

After deploy, open the Render URL. The homepage, API, offline frontend, and no-billing map mode all run from the same domain.

### Docker

```bash
docker build -t roadsos-ai .
docker run -p 8000:8000 roadsos-ai
```

## Project Structure

```text
RoadSOS-AI/
├── ai_logic/
├── backend/
├── database/
├── docs/
├── frontend/
├── app.py
├── Dockerfile
├── Procfile
├── render.yaml
└── requirements.txt
```

## Demo Script

1. Open the app.
2. Type `Road accident near me`.
3. The assistant classifies it as critical.
4. Nearby trauma centers and ambulance options appear.
5. Press `SOS` to generate a mock emergency alert.
6. Use device GPS or set manual coordinates.
7. Open Google route or OSM route from a nearby service card.
