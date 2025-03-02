import os
import time
from ADB_Data_Server.db import init_db, check_table_exists, store_sms, get_lastID
from ADB_Data_Server.sms import get_sms

def setup():
    if os.path.exists('sms_messages.db') and check_table_exists():
        sms_list = get_sms(get_lastID())
        store_sms(sms_list)
    else:
        init_db()
        sms_list = get_sms()
        store_sms(sms_list)

setup()
while True:
    sms_list = get_sms(get_lastID())
    if sms_list:
        store_sms(sms_list)
    else:
        print("No new messages found.")
    time.sleep(10)