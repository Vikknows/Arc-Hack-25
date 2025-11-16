# CrossPay — Global Salaries Made Local

Arc-Hack 2025 Project • Built with FastAPI + React + Circle Wallets

CrossPay converts global USD salaries into a local spending experience using:

- Real-time FX optimisation
- Instant and delayed salary buckets
- Circle Wallets (USDC) on Arc
- Python routing engine
- Neon-glass React frontend

This repository contains both the backend and frontend.  
Follow the instructions below to run the full system locally.

---

# Features

### 1. Salary Deposit Engine

Choose salary amount, instant percentage slice, max wait hours, and baseline FX.  
The backend tracks deposits and compares:

- instant conversion
- delayed conversion
- optimisation routing

### 2. Real-Time FX Optimiser

Runs Python routing logic that simulates market conditions ("Good", "Neutral", "Bad")  
and decides how much of the salary queue to convert each tick.

### 3. Circle Wallet Integration

Backend calls Circle Wallets API using:

- CIRCLE_API_KEY
- ENTITY_SECRET
- wallet set ID
- wallet ID and address

Frontend queries this live using the "Refresh wallet" button.

### 4. Neon React Dashboard

Built with:

- React + Vite
- Custom glass/neon styling
- Live optimisation panel
- Salary sliders and FX controls

---

# Installation and Running

This project requires:

- Python 3.10 or newer
- Node.js 18 or newer

You can run backend and frontend manually or use the included one-click script.

---

# Backend Setup (FastAPI)

Open a terminal:

```sh
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a .env file inside backend/:

```sh
CIRCLE_API_KEY=your_key_here
ENTITY_SECRET=your_entity_secret_here
CROSSPAY_WALLET_SET_ID=your_wallet_set_id
CROSSPAY_WALLET_ID=your_wallet_id
CROSSPAY_WALLET_ADDRESS=your_wallet_address
```

Start the backend:

```sh
uvicorn app.main:app --reload
```

Backend will run on:

```sh
http://127.0.0.1:8000
```

# Frontend Setup (React + Vite)

Open a new terminal window:

```sh
cd frontend
npm install
npm run dev
```

Frontend will be available at:

```sh
http://localhost:5173
```

# One Command Start

From the root folder:

```sh
chmod +x run.sh
./run.sh
```

The script will:

- Set up Python virtual environment

- Install backend dependencies

- Check .env exists

- Start FastAPI

- Install frontend dependencies

- Start Vite dev server
