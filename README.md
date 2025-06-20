# DLiver-Bot

A WhatsApp and SMS webhook server for intelligent order processing using PocketBase as the database and OpenAI for AI-powered natural language understanding.

## 📋 Overview

DLiver-Bot is an intelligent communication platform that integrates with WhatsApp and SMS APIs to automate customer interaction for order processing. The system verifies users by phone number or VAT (tax ID), processes orders using AI-powered natural language understanding, and confirms them through a conversational flow.

## ✨ Key Features

- **AI-Powered Order Processing**: Understands natural language orders in Romanian using OpenAI.
- **Multi-Platform Support**: WhatsApp and SMS integration.
- **Smart Product Matching**: AI matches product names, keywords, and quantities.
- **Real-time Validation**: Validates orders against available inventory.
- **Session Management**: Maintains conversation state across interactions.

## 🏛️ Architecture

The application follows a modular architecture:

- **Express Server**: Handles webhook endpoints for WhatsApp and SMS.
- **PocketBase**: Lightweight backend for data storage.
- **OpenAI**: Cloud AI model for natural language order processing.
- **Services Layer**: Manages business logic.
- **Terminal UI**: Displays runtime information and logs.

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- PocketBase executable (included in release or download from [pocketbase.io](https://pocketbase.io/))
- An OpenAI API key for AI order processing.

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/dliver-bot.git
    cd dliver-bot
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```

4. Configure your environment variables in the `.env` file:
    ```
    PORT=3000
    POCKETBASE_URL=http://127.0.0.1:8090
    POCKETBASE_ADMIN_EMAIL=your-email@example.com
    POCKETBASE_ADMIN_PASSWORD=your-secure-password
    WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

    OPENAI_API_KEY=your-openai-api-key
    AI_MODEL=gpt-4o-mini

    SMS_VERIFY_TOKEN=your-sms-verify-token
    ADB_DEVICE_IP=your-adb-device-ip:port
    ```

### Setting Up AI and SMS Services

**For AI (OpenAI) Configuration**:
- Ensure you have an OpenAI API key.
- Set the `OPENAI_API_KEY` and `AI_MODEL` in your `.env` file. The `AI_MODEL` can be set to `gpt-4o-mini` or any other OpenAI model.

**For SMS (ADB) Configuration**:
- Ensure ADB is set up on your system and your device is connected.
- Set the `ADB_DEVICE_IP` in your `.env` file to your device's IP address and port (e.g., `192.168.1.109:5555`).

**For SMS Webhook Forwarding**:
- Install [android_income_sms_gateway_webhook](https://github.com/bogkonstantin/android_income_sms_gateway_webhook) on your Android device and configure it to forward SMS to `your-server-ip:port/sms`.
- Install [ShellMS](https://github.com/try2codesecure/ShellMS) on your Android device to bypass Android 14/15 SMS restrictions.

### Running the Application

#### Connect to your PocketBase instance:

Make sure your PocketBase instance is running. You can use an existing instance or start a new one:

```bash
# For Linux/macOS
./pocketbase serve

# For Windows
pocketbase.exe serve
```

PocketBase admin UI is accessible at http://127.0.0.1:8090/_/

#### Set up the database collections:

```bash
npm run setup-collections
```

This will create all necessary collections and add sample product data.

#### Start the DLiver-Bot server:

```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3000).

#### Test OpenAI API connectivity

```bash
curl https://api.openai.com/v1/models
```

## 💾 Database Schema

The setup script creates the following collections in your PocketBase instance:

- **clients**: Stores client information (name, VAT number, phone)
- **userSessions**: Manages conversation state for users
- **products**: Stores product catalog with prices and descriptions
- **orders**: Records structured orders with line items placed by clients

## 🤖 AI Order Processing

The system uses OpenAI to process natural language orders in Romanian:

### How it works:
1. **User Input**: "Vreau 5 sticle Coca-Cola și 2 pachete chips"
2. **AI Processing**: Extracts products, quantities, and units
3. **Validation**: Matches against available inventory
4. **Confirmation**: Presents structured order for user confirmation

### Example Conversation:
```
User: "Am nevoie de 3 beri Ursus și 2 sticle apă"
Bot: "Comanda dumneavoastră este: 3 beri Ursus și 2 sticle apă. 
      
      Detalii comandă:
      3 sticla Bere Ursus
      2 sticla Apă
      
      Confirmați comanda? (da/nu)"
User: "da"
Bot: "Comanda dumneavoastră a fost confirmată și va fi procesată. Vă mulțumim!"
```

## 🔄 Webhook Integration

### WhatsApp API

Set up a webhook in the WhatsApp Business API or Meta for Developers dashboard pointing to:

```
https://your-server-address/webhook
```

Use the verification token defined in your `.env` file.

### SMS API

To handle incoming SMS messages and bypass potential limitations on newer Android versions (like Android 15/14), the following setup is required:

1.  **Install `android_income_sms_gateway_webhook`**:
    - [https://github.com/bogkonstantin/android_income_sms_gateway_webhook](https://github.com/bogkonstantin/android_income_sms_gateway_webhook)
    - Configure it to use the `/sms` endpoint of your DLiver-Bot server: `your-server-ip:port/sms`

2.  **Install `ShellMS`**:
    - [https://github.com/try2codesecure/ShellMS](https://github.com/try2codesecure/ShellMS)
    - This tool is necessary to integrate with the Android system and handle SMS functionalities, especially for bypassing Android 15/14 restrictions.

Ensure that your SMS provider (or the `android_income_sms_gateway_webhook` setup) sends incoming messages to your server's `/sms` endpoint. Include the verification token from your `.env` file as a header or query parameter as required by your setup.

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when changes are detected.

### Modifying PocketBase Collections

To modify the database schema, edit the collection definitions in `src/collections.js` and run:

```bash
npm run setup-collections
```

This will update your collections without affecting existing data.

### Troubleshooting

Check the terminal UI for real-time logs and API status. Detailed logs are written to `server.log`.

Common issues:
- Connection problems: Verify API keys and endpoints (WhatsApp, SMS, OpenAI)
- Database errors: Ensure PocketBase is running and accessible
- Authentication failures: Check your verification tokens
- AI issues: Ensure your OpenAI API key is correctly set.
- Performance: AI responses may be slow on first request (model loading)

To test PocketBase authentication:
```bash
npm run test-auth
```

To create a backup of your PocketBase data:
```bash
npm run backup-pb
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.