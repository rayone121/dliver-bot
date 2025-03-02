def log_message(message):
    with open("app.log", "a") as log_file:
        log_file.write(f"{message}\n")

def handle_error(error):
    log_message(f"Error: {error}")