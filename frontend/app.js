const demoLocation = { lat: 13.0067, lng: 80.2206 };
const apiBase = window.location.protocol === "file:" ? "http://127.0.0.1:8000" : window.location.origin;

let currentLocation = { ...demoLocation };
let services = [
  { id: "amb-1", type: "ambulance", name: "108 Emergency Ambulance", phone: "108", lat: 13.0105, lng: 80.2209, available: true },
  { id: "hosp-1", type: "hospital", name: "Apollo Speciality Hospital OMR", phone: "+91 44 4203 7777", lat: 12.9436, lng: 80.2362, available: true },
  { id: "hosp-2", type: "hospital", name: "Adyar Trauma Care Unit", phone: "+91 44 2441 2345", lat: 13.0068, lng: 80.2570, available: true },
  { id: "police-1", type: "police", name: "Adyar Traffic Police Station", phone: "100", lat: 13.0014, lng: 80.2565, available: true },
  { id: "amb-2", type: "ambulance", name: "Private Ambulance Partner", phone: "+91 98840 00000", lat: 12.9874, lng: 80.2181, available: false }
];

const emergencyWords = ["accident", "ambulance", "bleeding", "crash", "emergency", "fracture", "hit", "injured", "unconscious"];
const serviceWords = ["hospital", "trauma", "police", "station", "nearest", "nearby", "route"];
const safetyWords = ["first aid", "first-aid", "helmet", "safety", "checklist", "what to do"];

const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const serviceList = document.querySelector("#serviceList");
const networkBadge = document.querySelector("#networkBadge");
const backendStatus = document.querySelector("#backendStatus");
const locationValue = document.querySelector("#locationValue");
const gpsButton = document.querySelector("#gpsButton");
const manualLocationToggle = document.querySelector("#manualLocationToggle");
const manualLocationForm = document.querySelector("#manualLocationForm");
const manualLat = document.querySelector("#manualLat");
const manualLng = document.querySelector("#manualLng");
const osmMap = document.querySelector("#osmMap");

const serviceIcons = {
  ambulance: "AMB",
  hospital: "H",
  police: "POL"
};

let backendConnected = false;

function distanceKm(origin, service) {
  const toRad = value => (value * Math.PI) / 180;
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(service.lat);
  const dLat = toRad(service.lat - origin.lat);
  const dLng = toRad(service.lng - origin.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 100) / 100;
}

function normalizeService(item) {
  const distance = item.distance_km ?? item.distance ?? distanceKm(currentLocation, item);
  const eta = item.eta_min ?? item.eta ?? Math.max(3, Math.round(distance / 0.55));
  return { ...item, distance, eta };
}

function googleRouteUrl(service) {
  const origin = `${currentLocation.lat},${currentLocation.lng}`;
  const destination = `${service.lat},${service.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

function osmRouteUrl(service) {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${currentLocation.lat}%2C${currentLocation.lng}%3B${service.lat}%2C${service.lng}`;
}

function osmEmbedUrl() {
  const lat = currentLocation.lat;
  const lng = currentLocation.lng;
  const delta = 0.035;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function updateMapFrame() {
  osmMap.src = osmEmbedUrl();
}

function rankedServices(type) {
  return services
    .filter(item => !type || item.type === type)
    .map(normalizeService)
    .sort((a, b) => a.distance - b.distance || Number(b.available) - Number(a.available));
}

function classifyMessage(message) {
  const text = message.toLowerCase();
  const emergencyHits = emergencyWords.filter(word => text.includes(word)).length;
  const serviceHits = serviceWords.filter(word => text.includes(word)).length;
  const safetyHits = safetyWords.filter(word => text.includes(word)).length;

  if (emergencyHits) {
    return {
      intent: "emergency",
      urgency: emergencyHits >= 2 || text.includes("unconscious") ? "critical" : "high",
      reply: "I detected a road emergency. Call 108 or 112, share your location, stay away from traffic, and avoid moving injured people unless there is immediate danger."
    };
  }

  if (serviceHits) {
    return {
      intent: "service_lookup",
      urgency: "medium",
      reply: "I found nearby emergency services. Start with the closest available ambulance and trauma-ready hospital."
    };
  }

  if (safetyHits) {
    return {
      intent: "road_safety_info",
      urgency: "low",
      reply: "Secure the scene, call emergency services, check breathing, control bleeding, and keep the injured person warm and still."
    };
  }

  return {
    intent: "general",
    urgency: "low",
    reply: "Tell me what happened or ask for ambulance, trauma center, police, first aid, or road safety help."
  };
}

function setBackendStatus(connected) {
  backendConnected = connected;
  backendStatus.textContent = connected ? "Backend connected" : "Offline fallback";
  backendStatus.classList.toggle("connected", connected);
  backendStatus.classList.toggle("offline", !connected);
}

async function apiJson(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json();
}

async function checkBackend() {
  try {
    await apiJson("/health");
    setBackendStatus(true);
    await refreshServicesFromBackend();
  } catch {
    setBackendStatus(false);
  }
}

function addMessage(text, sender, urgency = "") {
  const message = document.createElement("div");
  message.className = `message ${sender} ${urgency === "critical" ? "critical" : ""}`.trim();
  message.textContent = text;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function updateLocationText(source) {
  const lat = currentLocation.lat.toFixed(5);
  const lng = currentLocation.lng.toFixed(5);
  locationValue.textContent = `${source}: ${lat}, ${lng}`;
}

function renderServices(type) {
  serviceList.innerHTML = "";
  rankedServices(type).forEach(item => {
    const card = document.createElement("div");
    card.className = "service-card";
    const status = item.available ? "Available" : "Fallback";
    const iconText = serviceIcons[item.type] || "ER";
    card.innerHTML = `
      <span class="service-icon ${item.type}" aria-hidden="true">${iconText}</span>
      <div class="service-body">
        <strong>${item.name}</strong>
        <div class="meta">
          <span>${item.type}</span>
          <span>${item.distance} km</span>
          <span>${item.eta} min ETA</span>
          <span>${status}</span>
          <span>${item.phone}</span>
        </div>
        <div class="route-actions">
          <a href="${googleRouteUrl(item)}" target="_blank" rel="noopener">Google route</a>
          <a href="${osmRouteUrl(item)}" target="_blank" rel="noopener">OSM route</a>
        </div>
      </div>
    `;
    serviceList.appendChild(card);
  });
}

async function refreshServicesFromBackend() {
  const params = new URLSearchParams({
    lat: String(currentLocation.lat),
    lng: String(currentLocation.lng)
  });
  const data = await apiJson(`/services/nearby?${params.toString()}`);
  services = data.services;
  renderServices();
}

async function handlePrompt(prompt) {
  addMessage(prompt, "user");
  try {
    const result = await apiJson("/chat", {
      method: "POST",
      body: JSON.stringify({ message: prompt, location: currentLocation })
    });
    addMessage(result.reply, "bot", result.urgency);
    if (result.services) {
      services = result.services;
      renderServices();
    }
    setBackendStatus(true);
  } catch {
    const result = classifyMessage(prompt);
    addMessage(`${result.reply} Backend is unavailable, so I am using offline emergency guidance.`, "bot", result.urgency);
    if (result.intent === "emergency" || result.intent === "service_lookup") {
      renderServices();
    }
    setBackendStatus(false);
  }
}

async function sendSos() {
  try {
    const data = await apiJson("/sos", {
      method: "POST",
      body: JSON.stringify({
        name: "RoadSOS demo user",
        message: "SOS from RoadSOS AI web app",
        location: currentLocation
      })
    });
    const plan = data.dispatch_plan;
    const ambulance = plan.primary_ambulance?.name || "call 108/112 directly";
    const hospital = plan.nearest_hospital?.name || "nearest available hospital";
    addMessage(`SOS ${data.sos_id} created. Dispatch: ${ambulance}. Nearest hospital: ${hospital}.`, "bot", "critical");
    setBackendStatus(true);
  } catch {
    const nearestHospital = rankedServices("hospital")[0];
    const nearestAmbulance = rankedServices("ambulance").find(item => item.available);
    addMessage(
      `SOS prepared offline. Dispatch: ${nearestAmbulance?.name || "call 108/112 directly"}. Nearest hospital: ${nearestHospital.name}, ${nearestHospital.distance} km.`,
      "bot",
      "critical"
    );
    setBackendStatus(false);
  }
}

function requestDeviceLocation() {
  if (!navigator.geolocation) {
    addMessage("Device GPS is not available in this browser. Use manual location instead.", "bot");
    return;
  }

  gpsButton.textContent = "Fetching GPS...";
  gpsButton.disabled = true;
  navigator.geolocation.getCurrentPosition(
    async position => {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      manualLat.value = currentLocation.lat.toFixed(6);
      manualLng.value = currentLocation.lng.toFixed(6);
      updateLocationText("Device GPS");
      updateMapFrame();
      addMessage("Location updated from device GPS.", "bot");
      gpsButton.textContent = "Use device GPS";
      gpsButton.disabled = false;
      try {
        await refreshServicesFromBackend();
        setBackendStatus(true);
      } catch {
        renderServices();
        setBackendStatus(false);
      }
    },
    error => {
      addMessage(`GPS permission failed: ${error.message}. Use manual location or open the app from http://127.0.0.1:8000/.`, "bot");
      gpsButton.textContent = "Use device GPS";
      gpsButton.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function updateNetworkBadge() {
  networkBadge.textContent = navigator.onLine ? "Online" : "Offline";
  networkBadge.classList.toggle("offline", !navigator.onLine);
}

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  const prompt = chatInput.value.trim();
  if (!prompt) return;
  chatInput.value = "";
  handlePrompt(prompt);
});

document.querySelector("#sosButton").addEventListener("click", sendSos);
document.querySelector("#refreshServices").addEventListener("click", async () => {
  try {
    await refreshServicesFromBackend();
    setBackendStatus(true);
  } catch {
    renderServices();
    setBackendStatus(false);
  }
});
document.querySelector("#clearChat").addEventListener("click", () => {
  chatLog.innerHTML = "";
  addMessage("RoadSOS ready. Describe the emergency or tap SOS.", "bot");
});
document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => handlePrompt(button.dataset.prompt));
});
gpsButton.addEventListener("click", requestDeviceLocation);
manualLocationToggle.addEventListener("click", () => {
  manualLocationForm.hidden = !manualLocationForm.hidden;
});
manualLocationForm.addEventListener("submit", async event => {
  event.preventDefault();
  const lat = Number(manualLat.value);
  const lng = Number(manualLng.value);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    addMessage("Enter valid latitude and longitude values.", "bot");
    return;
  }
  currentLocation = { lat, lng };
  updateLocationText("Manual location");
  updateMapFrame();
  try {
    await refreshServicesFromBackend();
    setBackendStatus(true);
  } catch {
    renderServices();
    setBackendStatus(false);
  }
});

window.addEventListener("online", updateNetworkBadge);
window.addEventListener("offline", updateNetworkBadge);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

updateNetworkBadge();
updateLocationText("Demo location");
updateMapFrame();
renderServices();
addMessage("RoadSOS ready. Describe the emergency or tap SOS.", "bot");
checkBackend();
