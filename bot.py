import subprocess
import json
from datetime import datetime


def get_sms():
    command = "adb shell content query --uri content://sms/"
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            messages = result.stdout.strip().split("\n")
            sms_list = []

            for message in messages:
                sms_data = {}
                for item in message.split(", "):
                    key_value = item.split("=")
                    if len(key_value) == 2:
                        key, value = key_value
                        sms_data[key] = value

                # Extract required fields
                formatted_sms = {
                    "id": sms_data.get("thread_id"),
                    "phone_number": sms_data.get("address"),
                    "body": sms_data.get("body"),
                }

                # Convert timestamp to human-readable date & time
                timestamp = sms_data.get("date_sent")
                if timestamp:
                    dt_object = datetime.utcfromtimestamp(int(timestamp) / 1000)
                    formatted_sms["date"] = dt_object.strftime("%Y-%m-%d")
                    formatted_sms["time"] = dt_object.strftime("%H:%M:%S")

                sms_list.append(formatted_sms)

            return sms_list
        else:
            print("Error executing ADB command:", result.stderr)
            return None
    except Exception as e:
        print("Exception occurred:", str(e))
        return None


# Fetch SMS messages
sms_messages = get_sms()

# Save formatted SMS data to a JSON file
if sms_messages:
    with open('formatted_sms_messages.json', 'w') as file:
        json.dump(sms_messages, file, indent=4)
    print("Formatted SMS messages saved to formatted_sms_messages.json")
