from flask import Flask, request, jsonify
from dotenv import load_dotenv
import sqlite3
import os
import requests

# Initialize Flask app
app = Flask(__name__)

# Environment variables
load_dotenv()
WEBHOOK_VERIFY_TOKEN = os.getenv("WEBHOOK_VERIFY_TOKEN")
GRAPH_API_TOKEN = os.getenv("GRAPH_API_TOKEN")
PORT = int(os.getenv("PORT", 5000))

# Initialize SQLite database
DB_NAME = "whatsapp_data.db"

def init_db():
    """Initialize SQLite database and create table if it doesn't exist."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number_id TEXT,
            message_id TEXT,
            from_number TEXT,
            message_type TEXT,
            message_body TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

# Initialize the database on app startup
init_db()

@app.route("/webhook", methods=["POST"])
def webhook_post():
    """Handle incoming POST requests from the WhatsApp API webhook."""
    try:
        # Log incoming messages
        print("Incoming webhook message:", request.json)

        # Extract data from the request body
        data = request.json
        message = data.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("messages", [{}])[0]

        # Check if the incoming message contains text
        if message.get("type") == "text":
            business_phone_number_id = data["entry"][0]["changes"][0]["value"]["metadata"]["phone_number_id"]
            from_number = message["from"]
            message_body = message["text"]["body"]
            message_id = message["id"]

            # Store the message in the SQLite database
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO messages (phone_number_id, message_id, from_number, message_type, message_body)
                VALUES (?, ?, ?, ?, ?)
            """, (business_phone_number_id, message_id, from_number, message["type"], message_body))
            conn.commit()
            conn.close()

            # Send a reply message
            reply_message(business_phone_number_id, from_number, f"Echo: {message_body}", message_id)

            # Mark the incoming message as read
            mark_message_as_read(business_phone_number_id, message_id)

        return "", 200

    except Exception as e:
        print("Error processing webhook:", e)
        return jsonify({"error": "Failed to process webhook"}), 400


@app.route("/webhook", methods=["GET"])
def webhook_get():
    """Handle GET requests for webhook verification."""
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    if mode == "subscribe" and token == WEBHOOK_VERIFY_TOKEN:
        print("Webhook verified successfully!")
        return challenge, 200
    else:
        return "Forbidden", 403


@app.route("/", methods=["GET"])
def home():
    """Default route."""
    return "<pre>Nothing to see here.\nCheckout README.md to start.</pre>"


def reply_message(phone_number_id, to_number, message_body, context_message_id):
    """Send a reply message to the user."""
    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    headers = {"Authorization": f"Bearer {GRAPH_API_TOKEN}"}
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "text": {"body": message_body},
        "context": {"message_id": context_message_id},
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        print("Failed to send reply message:", response.text)


def mark_message_as_read(phone_number_id, message_id):
    """Mark the incoming message as read."""
    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    headers = {"Authorization": f"Bearer {GRAPH_API_TOKEN}"}
    payload = {
        "messaging_product": "whatsapp",
        "status": "read",
        "message_id": message_id,
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        print("Failed to mark message as read:", response.text)


if __name__ == "__main__":
    app.run(port=PORT)