import json
import os
import re
import time
import urllib.request
from datetime import datetime, timezone

import boto3

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

POSITIONS_URL = "https://gtfsrt.renfe.com/vehicle_positions.json"
DELAYS_URL = "https://gtfsrt.renfe.com/trip_updates.json"
INTERVAL = int(os.environ.get("FETCH_INTERVAL_SECONDS", "30"))

# feed sometimes has nonsense like -8580s, treat as unknown
MIN_DELAY = -300

# comunidad de madrid, the feed covers all of spain
MADRID_BBOX = {"lat": (39.85, 41.17), "lon": (-4.6, -3.05)}
LINE_RE = re.compile(r"C\d+[a-z]?", re.IGNORECASE)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "mymadrid"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def parse_delays(feed):
    delays = {}
    for entity in feed.get("entity", []):
        tu = entity.get("tripUpdate") or {}
        trip_id = (tu.get("trip") or {}).get("tripId")
        if not trip_id:
            continue

        delay = tu.get("delay")
        if delay is None:
            for stu in tu.get("stopTimeUpdate", []):
                delay = (stu.get("arrival") or stu.get("departure") or {}).get("delay")
                if delay is not None:
                    break

        if delay is not None and int(delay) >= MIN_DELAY:
            delays[trip_id] = int(delay)
    return delays


def in_madrid(lat, lon):
    return (
        MADRID_BBOX["lat"][0] <= lat <= MADRID_BBOX["lat"][1]
        and MADRID_BBOX["lon"][0] <= lon <= MADRID_BBOX["lon"][1]
    )


def parse(feed, delays):
    trains = []
    for entity in feed.get("entity", []):
        v = entity.get("vehicle") or {}
        pos = v.get("position") or {}
        lat, lon = pos.get("latitude"), pos.get("longitude")
        if lat is None or lon is None or not in_madrid(lat, lon):
            continue

        label = (v.get("vehicle") or {}).get("label", "")
        match = LINE_RE.search(label) or LINE_RE.search(entity.get("id", ""))
        trip_id = (v.get("trip") or {}).get("tripId")

        trains.append({
            "id": entity.get("id"),
            "line": match.group(0).upper() if match else "?",
            "label": label,
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "status": v.get("currentStatus"),
            "stop": v.get("stopId"),
            "trip": trip_id,
            "delay": delays.get(trip_id),
            "ts": v.get("timestamp"),
        })
    return trains


def fetch_and_store():
    try:
        feed = fetch(POSITIONS_URL)
    except Exception as e:
        print(f"positions fetch failed: {e}")
        return None

    # still store positions if delays are down
    try:
        delays = parse_delays(fetch(DELAYS_URL))
    except Exception as e:
        print(f"delays fetch failed: {e}")
        delays = {}

    feed_ts = int(feed.get("header", {}).get("timestamp", time.time()))
    trains = parse(feed, delays)

    # stored as a json string, boto3 doesn't take floats
    table.put_item(Item={
        "pk": "TRAINS",
        "sk": datetime.fromtimestamp(feed_ts, timezone.utc).isoformat(),
        "count": len(trains),
        "trains": json.dumps(trains),
        "expires_at": int(time.time()) + 30 * 24 * 3600,
    })
    print(f"stored {len(trains)} trains")
    return len(trains)


# eventbridge minimum is 1 minute, so run several times per invocation
def handler(event, context):
    results = []
    runs = max(1, 60 // INTERVAL)

    for i in range(runs):
        start = time.time()
        results.append(fetch_and_store())

        if i < runs - 1:
            time.sleep(max(0, INTERVAL - (time.time() - start)))

    return results
