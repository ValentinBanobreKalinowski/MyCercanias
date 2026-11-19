import json
import os

import boto3
from boto3.dynamodb.conditions import Key

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


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
        return {"updated": None, "trains": []}

    item = res["Items"][0]
    return {"updated": item["sk"], "trains": json.loads(item["trains"])}


def handler(event, context):
    path = event.get("rawPath", "")

    if path == "/api/health":
        return response(200, {"status": "ok"})

    if path == "/api/trains":
        return response(200, latest_trains())

    return response(404, {"error": "not found"})
