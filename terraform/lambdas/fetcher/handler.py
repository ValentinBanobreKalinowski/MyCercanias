import json
import os
import re
import time
import urllib.request
from datetime import datetime, timezone

import boto3

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

SOURCE_URL = "https://gtfsrt.renfe.com/vehicle_positions.json"
INTERVAL = int(os.environ.get("FETCH_INTERVAL_SECONDS", "30"))

# comunidad de madrid, the feed covers all of spain
MADRID_BBOX = {"lat": (39.85, 41.17), "lon": (-4.6, -3.05)}
LINE_RE = re.compile(r"C\d+[a-z]?", re.IGNORECASE)


def fetch():
    req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "mymadrid"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def in_madrid(lat, lon):
    return (
        MADRID_BBOX["lat"][0] <= lat <= MADRID_BBOX["lat"][1]
        and MADRID_BBOX["lon"][0] <= lon <= MADRID_BBOX["lon"][1]
    )


def parse(feed):
    trains = []
    for entity in feed.get("entity", []):
        v = entity.get("vehicle") or {}
        pos = v.get("position") or {}
        lat, lon = pos.get("latitude"), pos.get("longitude")
        if lat is None or lon is None or not in_madrid(lat, lon):
            continue

        label = (v.get("vehicle") or {}).get("label", "")
        match = LINE_RE.search(label) or LINE_RE.search(entity.get("id", ""))

        trains.append({
            "id": entity.get("id"),
            "line": match.group(0).upper() if match else "?",
            "label": label,
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "status": v.get("currentStatus"),
            "stop": v.get("stopId"),
            "trip": (v.get("trip") or {}).get("tripId"),
            "ts": v.get("timestamp"),
        })
    return trains


def fetch_and_store():
    try:
        feed = fetch()
    except Exception as e:
        print(f"fetch failed: {e}")
        return None

    feed_ts = int(feed.get("header", {}).get("timestamp", time.time()))
    trains = parse(feed)

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
