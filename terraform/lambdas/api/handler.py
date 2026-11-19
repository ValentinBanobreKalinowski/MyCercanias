import json
import os
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

# older than this means no trains running (night) or the fetcher is down
MAX_AGE_SECONDS = 10 * 60


def response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }


def latest_trains():
    res = table.query(
        KeyConditionExpression=Key("pk").eq("TRAINS"),
        ScanIndexForward=False,
        Limit=1,
    )
    if not res["Items"]:
        return {"updated": None, "stale": True, "trains": []}

    item = res["Items"][0]
    age = (datetime.now(timezone.utc) - datetime.fromisoformat(item["sk"])).total_seconds()
    if age > MAX_AGE_SECONDS:
        return {"updated": item["sk"], "stale": True, "trains": []}

    return {"updated": item["sk"], "stale": False, "trains": json.loads(item["trains"])}


def handler(event, context):
    path = event.get("rawPath", "")

    if path == "/api/health":
        return response(200, {"status": "ok"})

    if path == "/api/trains":
        return response(200, latest_trains())

    return response(404, {"error": "not found"})
