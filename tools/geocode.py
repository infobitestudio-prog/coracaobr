#!/usr/bin/env python3
"""Confere latitude/longitude de cada lugar pelo endereço (US Census Geocoder; OpenStreetMap como reserva).
Grava research/geocode.json: {id: {lat, lng, fonte}}."""
import json, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
def get(url):
    return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "guide-geocode/0.1"}), timeout=25).read())
out = {}
for l in json.loads((ROOT / "data/seed.json").read_text())["lugares"]:
    end = (l.get("endereco") or "").strip()
    if not end: continue
    r = None
    try:
        m = get("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=" + urllib.parse.quote(end))["result"]["addressMatches"]
        if m: r = {"lat": round(m[0]["coordinates"]["y"], 6), "lng": round(m[0]["coordinates"]["x"], 6), "fonte": "census"}
    except Exception as e: print("census falhou", l["id"], type(e).__name__)
    if not r:
        try:
            time.sleep(1.1)
            m = get("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" + urllib.parse.quote(end))
            if m: r = {"lat": round(float(m[0]["lat"]), 6), "lng": round(float(m[0]["lon"]), 6), "fonte": "osm"}
        except Exception as e: print("osm falhou", l["id"], type(e).__name__)
    if r: out[l["id"]] = r
    (ROOT / "research/geocode.json").write_text(json.dumps(out, indent=1))
print(len(out), "geocodificados")
