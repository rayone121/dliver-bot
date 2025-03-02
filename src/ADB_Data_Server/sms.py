import subprocess
import re

def get_sms(last_id=0):
    command = (
        f"adb shell content query --uri content://sms/ "
        f"--projection _id,thread_id,address,body,date_sent | awk -F'[_=,]' '$3 > {last_id}'"
    )
    process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    output_lines = process.stdout.readlines()
    process.stdout.close()
    process.wait()
    
    rows = []
    current_row = ""
    for line in output_lines:
        line = line.strip()
        if line.startswith("Row:"):
            if current_row:
                rows.append(current_row)
            current_row = line
        else:
            current_row += " " + line
    if current_row:
        rows.append(current_row)

    sms_list = []
    for row in rows:
        row_clean = re.sub(r'^Row:\s*\d+\s*', '', row)
 
        parts = [part.strip() for part in row_clean.split(',')]
        row_dict = {}
        for part in parts:
            if '=' in part:
                key, value = part.split('=', 1)
                row_dict[key.strip()] = value.strip()
        
        try:
            sms = {
                'id': int(row_dict.get('_id', 0)),
                'thread_id': int(row_dict.get('thread_id', 0)),
                'phone_number': row_dict.get('address', ''),
                'body': row_dict.get('body', ''),
                'date': int(row_dict.get('date_sent', 0))
            }
            sms_list.append(sms)
        except Exception as e:
            print(f"Error processing row: {row}\nError: {e}")
    
    return sms_list