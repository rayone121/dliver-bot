# DLiver-Bot

A WhatsApp and SMS webhook server for intelligent order processing using PocketBase as the database and Ollama for AI-powered natural language understanding.

## 📋 Overview

DLiver-Bot is an intelligent communication platform that integrates with WhatsApp and SMS APIs to automate customer interaction for order processing. The system verifies users by phone number or VAT (tax ID), processes orders using AI-powered natural language understanding, and confirms them through a conversational flow.

## ✨ Key Features

- **AI-Powered Order Processing**: Understands natural language orders in Romanian
- **Multi-Platform Support**: WhatsApp and SMS integration
- **Smart Product Matching**: AI matches product names, keywords, and quantities
- **Fallback Mode**: Graceful degradation when AI service is unavailable
- **Real-time Validation**: Validates orders against available inventory
- **Session Management**: Maintains conversation state across interactions

## 🏛️ Architecture

The application follows a modular architecture:

- **Express Server**: Handles webhook endpoints for WhatsApp and SMS
- **PocketBase**: Lightweight backend for data storage
- **Ollama**: Local AI model for natural language order processing
- **Services Layer**: Manages business logic
- **Terminal UI**: Displays runtime information and logs

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- PocketBase executable (included in release or download from [pocketbase.io](https://pocketbase.io/))
- Ollama for AI order processing (download from [ollama.ai](https://ollama.ai))

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

# AI Service Configuration
AI_SERVICE_URL=http://localhost:11434
AI_MODEL=llama3.2
AI_REQUEST_TIMEOUT=30000

# Add other required API keys and settings
```

### Setting Up AI Service

1. **Install Ollama**: Download and install from [ollama.ai](https://ollama.ai)

2. **Pull a language model**:
```bash
ollama pull llama3.2
# or use a different model like llama2
```

3. **Start Ollama service**:
```bash
ollama serve
```

4. **Test AI service**:
```bash
curl http://localhost:11434/api/version
```

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

#### Test AI Integration:

Once the server is running, you can test the AI integration:

```bash
# Health check
curl http://localhost:3000/ai/health

# Test AI service connectivity
curl http://localhost:3000/ai/test

# Test order processing
curl -X POST http://localhost:3000/ai/process-order \
  -H "Content-Type: application/json" \
  -d '{"orderText": "Vreau 5 sticle Coca-Cola și 2 pachete chips"}'
```

## 💾 Database Schema

The setup script creates the following collections in your PocketBase instance:

- **clients**: Stores client information (name, VAT number, phone)
- **userSessions**: Manages conversation state for users
- **products**: Stores product catalog with prices and descriptions
- **orders**: Records structured orders with line items placed by clients

## 🤖 AI Order Processing

The system uses Ollama to process natural language orders in Romanian:

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

### AI Endpoints:
- `GET /ai/health` - Check AI service status
- `GET /ai/test` - Test AI connectivity
- `GET /ai/config` - Get AI configuration
- `POST /ai/process-order` - Process test orders
- `GET /ai/training-data` - Export training data

For detailed AI configuration, see [AI_CONFIG.md](AI_CONFIG.md).

## 🔄 Webhook Integration

### WhatsApp API

Set up a webhook in the WhatsApp Business API or Meta for Developers dashboard pointing to:

```
https://your-server-address/webhook
```

Use the verification token defined in your `.env` file.

### SMS API

Set up your SMS provider to send incoming messages to:

```
https://your-server-address/sms
```

Include the verification token from your `.env` file as a header or query parameter.

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when changes are detected.

### AI Service Configuration

For detailed AI setup and configuration, see [AI_CONFIG.md](AI_CONFIG.md).

Key points:
- Configure `AI_SERVICE_URL` and `AI_MODEL` in your `.env` file
- Ensure Ollama is running before starting the bot
- The system gracefully falls back to manual processing if AI is unavailable

### Modifying PocketBase Collections

To modify the database schema, edit the collection definitions in `src/utils/createCollections.js` and run:

```bash
npm run setup-collections
```

This will update your collections without affecting existing data.

## 🔍 Troubleshooting

Check the terminal UI for real-time logs and API status. Detailed logs are written to `server.log`.

Common issues:
- Connection problems: Verify API keys and endpoints
- Database errors: Ensure PocketBase is running and accessible
- Authentication failures: Check your verification tokens
- AI issues: Make sure Ollama is running and the model is available
- Performance: AI responses may be slow on first request (model loading)

To test PocketBase authentication:
```bash
npm run test-auth
```

To create a backup of your PocketBase data:
```bash
npm run backup-pb
```

To test AI service status:
```bash
curl http://localhost:3000/ai/health
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Fine-tuning with Unsloth using the Generated .parquet Dataset

This project can generate ShareGPT-style training data in `.parquet` format, suitable for fine-tuning LLMs using [Unsloth](https://github.com/unslothai/unsloth). Below are the steps to use your generated dataset for fine-tuning:

### 1. Generate the Training Data

Run the generator script to produce a `.parquet` file:

```bash
python training/generate_sharegpt_data.py --total 1000 --local --output my_training_data.parquet
```

- Use `--local` for local generation, or provide your OpenAI API key for API-based generation.
- The output file will be in the format required for ShareGPT-style conversational fine-tuning.

### 2. Inspect the Parquet File

The `.parquet` file contains a DataFrame with columns:
- `conversations`: a list of dicts, each with `from` ("human" or "gpt") and `value` (string, for gpt this is a JSON string)
- `id`: unique conversation id
- `source`: "local" or "openai_gpt4"
- `created`: ISO timestamp

You can inspect the file using pandas:

```python
import pandas as pd

df = pd.read_parquet('my_training_data.parquet')
print(df.head())
```

### 3. Convert to Unsloth Format

Unsloth expects a list of conversations, where each conversation is a list of messages (dicts with `role` and `content`).
You can convert the data as follows:

```python
import pandas as pd
import json

def convert_to_unsloth_format(parquet_path, output_jsonl_path):
    df = pd.read_parquet(parquet_path)
    with open(output_jsonl_path, 'w', encoding='utf-8') as f:
        for row in df.itertuples():
            conv = []
            for msg in row.conversations:
                role = 'user' if msg['from'] == 'human' else 'assistant'
                content = msg['value']
                # Optionally, for gpt, you can parse the JSON string if needed:
                # if role == 'assistant':
                #     content = json.loads(content)['orderSummary']
                conv.append({"role": role, "content": content})
            f.write(json.dumps({"conversations": conv}, ensure_ascii=False) + '\n')

# Example usage:
convert_to_unsloth_format('my_training_data.parquet', 'unsloth_data.jsonl')
```

### 4. Fine-tune with Unsloth

Follow the [Unsloth documentation](https://github.com/unslothai/unsloth) for fine-tuning. Typically, you will:

- Prepare your data as a JSONL file as above.
- Use the Unsloth CLI or Python API to start training:

```bash
unsloth train --model <your-model> --data unsloth_data.jsonl --output <output-dir>
```

Or in Python:

```python
from unsloth import UnslothTrainer
trainer = UnslothTrainer(
    model_name_or_path='<your-model>',
    data_path='unsloth_data.jsonl',
    output_dir='./finetuned-model',
    # ...other params
)
trainer.train()
```

### Notes
- You may want to further process the assistant (gpt) responses to extract only the `orderSummary` or keep the full JSON, depending on your use case.
- The local generator covers all error, edge, and valid cases for robust training.
- For large datasets, consider shuffling and splitting into train/validation sets.

---

For more details, see the [Unsloth documentation](https://github.com/unslothai/unsloth) and the code in `training/generate_sharegpt_data.py`.