import subprocess


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

                sms_list.append(sms_data)

            return sms_list
        else:
            print("Error executing ADB command:", result.stderr)
            return None
    except Exception as e:
        print("Exception occurred:", str(e))
        return None


# Fetch SMS messages
sms_messages = get_sms()
print(sms_messages)

# Output:
#print sms_messages to a json file with corect format
import json
with open('sms_messages.json', 'w') as file:
    json.dump(sms_messages, file, indent=4)




