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


def handler(event, context):
    path = event.get("rawPath", "")

    if path == "/api/health":
        return response(200, {"status": "ok"})

    if path == "/api/items":
        res = table.query(
            KeyConditionExpression=Key("pk").eq("FETCH"),
            ScanIndexForward=False,
            Limit=20,
        )
        return response(200, {"items": res["Items"]})

    return response(404, {"error": "not found"})
