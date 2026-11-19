import json
import os
import time
import urllib.request
from datetime import datetime, timezone

import boto3

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

# TODO: replace with the real data source
SOURCE_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=40.4168&longitude=-3.7038&current=temperature_2m,wind_speed_10m"
)


def fetch():
    try:
        with urllib.request.urlopen(SOURCE_URL, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"fetch failed: {e}")
        return None


INTERVAL = int(os.environ.get("FETCH_INTERVAL_SECONDS", "30"))


def fetch_and_store():
    data = fetch()
    item = {
        "pk": "FETCH",
        "sk": datetime.now(timezone.utc).isoformat(),
        "ok": data is not None,
        "payload": json.dumps(data) if data else "",
        "expires_at": int(time.time()) + 30 * 24 * 3600,
    }
    table.put_item(Item=item)
    return item


# eventbridge minimum is 1 minute, so run several times per invocation
def handler(event, context):
    results = []
    runs = max(1, 60 // INTERVAL)

    for i in range(runs):
        start = time.time()
        item = fetch_and_store()
        results.append({"stored": item["sk"], "ok": item["ok"]})

        if i < runs - 1:
            time.sleep(max(0, INTERVAL - (time.time() - start)))

    return results
