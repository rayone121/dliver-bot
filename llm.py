import requests
import json
import sqlite3

def extract_messages_from_db(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT message FROM messages")
    rows = cursor.fetchall()
    messages = [row[0] for row in rows]
    conn.close()
    return messages

def send_prompt_to_ollama(messages):
    url = "http://192.168.1.152:11434/api/generate"
    prompt = " ".join(messages)
    payload = {"model": "deepseek-r1:8b", "prompt": prompt}
    response = requests.post(url, json=payload)
    
    try:
        json_objects = response.content.decode('utf-8').split('\n')
        final_response = ""
        for obj in json_objects:
            if obj.strip():
                data = json.loads(obj)
                final_response += data.get("response", "")
        print(final_response)
    except requests.exceptions.JSONDecodeError as e:
        print("JSONDecodeError:", e)
        print("Response content:", response.content)

def main():
    db_path = './webhookServer/messages.db'  
    messages = extract_messages_from_db(db_path)
    send_prompt_to_ollama(messages)

if __name__ == "__main__":
    main()