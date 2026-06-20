<p align="center">
  <img src="https://img.shields.io/badge/🛰️-GHOSTNET_AI-ff1a1a?style=for-the-badge&labelColor=0a0a0a" alt="GhostNet AI" />
</p>

<h1 align="center">🛰️ GhostNet AI</h1>

<h3 align="center">
  <em>Decentralized AI-Powered Emergency Coordination System</em>
</h3>

<p align="center">
  <strong>When the internet goes down, GhostNet stays up.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat-square&logo=solidity" alt="Solidity" />
  <img src="https://img.shields.io/badge/Monad-Testnet-7c3aed?style=flat-square" alt="Monad" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" alt="Express" />
  <img src="https://img.shields.io/badge/React-Vite-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/React_Native-Expo-000020?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?style=flat-square&logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Bluetooth-Mesh_Network-0082FC?style=flat-square&logo=bluetooth" alt="Bluetooth" />
</p>

---

## 🤔 What is GhostNet AI?

Imagine a **massive earthquake** hits your city. The internet is gone. Phone towers are destroyed. People are hurt, trapped, and need help — but **nobody can communicate**.

**GhostNet AI** solves this problem. It is an **emergency coordination system** that works even **without the internet** using **Bluetooth mesh networking**. It uses **Artificial Intelligence** to understand emergency messages and decide what help to send, and stores every decision on a **blockchain** so nobody can cheat or tamper with the records.

### 🧠 How It Works (Simple Version)

```
📱 Someone sends an emergency message
     ↓
📡 Message travels phone-to-phone via Bluetooth (no internet needed!)
     ↓
🤖 AI reads the message and understands:
     • What type of emergency? (Medical, Fire, Missing Person...)
     • How urgent is it? (Critical, High, Medium, Low)
     • What resource to send? (Ambulance, Rescue Team, Food...)
     ↓
💰 Economic Engine decides:
     • Is this resource available?
     • Should we save it for a more critical case?
     • Can we substitute with something else?
     ↓
⛓️ Decision is permanently recorded on blockchain
     • Nobody can change it
     • Anyone can verify it
     • Full transparency & accountability
     ↓
📊 Dashboard shows everything in real-time
```

---

## ✨ Key Features

| Feature | What It Does |
|---------|-------------|
| 🤖 **AI Emergency Classifier** | Uses Google Gemini AI to instantly categorize emergencies and assign priority levels |
| 💰 **Economic Resource Engine** | Smart allocation system that balances urgency vs. scarcity — like a game theory engine for disaster relief |
| 📡 **Bluetooth Mesh Network** | Messages hop phone-to-phone via Bluetooth — works with zero internet |
| ⛓️ **Blockchain Audit Trail** | Every AI decision is hashed and stored on Monad blockchain — tamper-proof and verifiable |
| 🔍 **Tamper Detection** | Simulate database corruption and watch the blockchain catch the fraud |
| 🖥️ **Real-Time Dashboard** | Beautiful dark-mode portal with live resource gauges, mesh topology, and audit ledger |
| 📱 **Mobile App** | Field agent app built with React Native — send emergencies from the ground |

---

## 🏗️ Project Architecture

```
ghostnet-ai/
│
├── 🤖 ai/                    ← Python AI Agent (FastAPI)
│   ├── agent.py               ← Main API server with resource allocation
│   ├── classifier.py          ← Gemini AI + keyword fallback classifier
│   ├── ble_listener.py        ← Bluetooth Low Energy mesh listener
│   └── requirements.txt       ← Python dependencies
│
├── ⚙️ backend/                ← Node.js API Gateway (Express)
│   ├── server.js              ← REST API endpoints
│   ├── blockchainHelper.js    ← Monad/Hardhat smart contract bridge
│   └── db.js                  ← Local JSON database ledger
│
├── ⛓️ blockchain/             ← Solidity Smart Contracts (Hardhat)
│   ├── contracts/
│   │   └── GhostNetAgent.sol  ← Decision storage & verification contract
│   ├── scripts/
│   │   └── deploy.js          ← Deployment script
│   └── hardhat.config.js      ← Network configuration (Monad Testnet)
│
├── 🖥️ dashboard/              ← React Web Dashboard (Vite + Tailwind)
│   └── src/
│       └── App.tsx            ← Full coordination portal UI
│
└── 📱 mobile/                 ← React Native Mobile App (Expo)
    ├── App.tsx                ← Main app with tab navigation
    ├── screens/               ← Emergency Create, Feed, Decisions
    ├── mesh/                  ← Mesh networking logic
    └── modules/               ← Native BLE module
```

---

## 🧩 Tech Stack

| Layer | Technology | Why We Chose It |
|-------|-----------|-----------------|
| **AI Engine** | Python + FastAPI + Gemini 1.5 Flash | Fast async API with world-class AI for emergency classification |
| **Backend** | Node.js + Express | Lightweight API gateway that connects AI ↔ Blockchain ↔ Clients |
| **Blockchain** | Solidity + Hardhat + Monad Testnet | Immutable audit trail with high-speed EVM-compatible chain |
| **Dashboard** | React + Vite + Tailwind CSS | Beautiful, responsive real-time monitoring portal |
| **Mobile** | React Native + Expo | Cross-platform (Android + iOS) with native Bluetooth access |
| **Mesh Network** | Bluetooth Low Energy (BLE) | Offline peer-to-peer communication without internet |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:

- **Node.js** (v18+) — [Download](https://nodejs.org/)
- **Python** (v3.10+) — [Download](https://python.org/)
- **Git** — [Download](https://git-scm.com/)
- **Expo CLI** — `npm install -g expo-cli`

### Step 1: Clone the Project

```bash
git clone https://github.com/Prince200510/Message.git
cd Message
```

### Step 2: Start the Blockchain (Terminal 1)

```bash
cd blockchain
npm install
npx hardhat node
```

This starts a local blockchain on `http://127.0.0.1:8545`.

### Step 3: Deploy the Smart Contract (Terminal 2)

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

📝 **Copy the contract address** from the output — you'll need it next.

### Step 4: Configure the Backend

Create a file `backend/.env`:

```env
PORT=5000
AI_SERVICE_URL=http://127.0.0.1:8000
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=<PASTE_YOUR_CONTRACT_ADDRESS_HERE>
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
```

> 💡 The private key above is the default Hardhat test account — only for local development!

### Step 5: Start the AI Agent (Terminal 3)

```bash
cd ai
pip install -r requirements.txt
python agent.py
```

The AI agent runs on `http://127.0.0.1:8000`. Visit `http://127.0.0.1:8000/docs` for the interactive API docs.

### Step 6: Start the Backend (Terminal 4)

```bash
cd backend
npm install
npm start
```

The backend runs on `http://127.0.0.1:5000`.

### Step 7: Start the Dashboard (Terminal 5)

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:5173` in your browser — you'll see the GhostNet AI dashboard! 🎉

### Step 8: Start the Mobile App (Optional)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** app on your phone.

---

## 📡 API Endpoints

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| `POST` | `/api/emergency` | Submit a new emergency message |
| `GET` | `/api/emergencies` | Get all emergency records |
| `GET` | `/api/decisions` | Get all AI decision records |
| `GET` | `/api/resources` | Get current resource availability |
| `POST` | `/api/resources/reset` | Reset all resources to full |
| `GET` | `/api/verify/:id` | Verify a decision against blockchain |
| `POST` | `/api/verify/tamper/:id` | Simulate database tampering |
| `GET` | `/api/decision/:id` | Get a specific decision by ID |

### Example: Submit an Emergency

```bash
curl -X POST http://localhost:5000/api/emergency \
  -H "Content-Type: application/json" \
  -d '{"text": "Person bleeding badly near sector 5", "sender": "Field Agent 1"}'
```

**Response:**
```json
{
  "emergency": {
    "id": "abc-123",
    "text": "Person bleeding badly near sector 5",
    "priority": "CRITICAL",
    "category": "MEDICAL",
    "resourceNeeded": "AMBULANCE",
    "status": "ALLOCATED"
  },
  "decision": {
    "action": "Dispatched AMBULANCE #1",
    "resource": "AMBULANCE #1",
    "txHash": "0x7a3b...",
    "isVerified": true,
    "economics": {
      "utilityScore": 100,
      "scarcityCost": 80,
      "decision": "APPROVED"
    }
  },
  "isMockChain": false
}
```

---

## 💰 How the Economic Engine Works

The AI doesn't just blindly assign resources. It uses an **economic decision model**:

```
Utility Payoff (How urgent)     vs.     Scarcity Cost (How rare)
━━━━━━━━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL  → 100 points                  Cost increases as supply
HIGH      →  75 points                  decreases (dynamic pricing)
MEDIUM    →  45 points
LOW       →  15 points
```

### Decision Outcomes

| Outcome | When It Happens |
|---------|----------------|
| ✅ **APPROVED** | Utility ≥ Cost → Resource dispatched immediately |
| 🔄 **CONSERVED & SUBSTITUTED** | Utility < Cost → Premium resource saved, cheaper alternative sent |
| 🔀 **SUBSTITUTED** | Resource depleted → Next best alternative dispatched |
| ⏳ **QUEUED** | All resources depleted → Emergency placed in waiting queue |

### Example Scenario

> *"Low-priority request asks for an Ambulance, but only 1 ambulance remains."*

The engine thinks: *"Utility payoff (15) < Scarcity cost (160). This ambulance should be saved for a CRITICAL case. Send a Medical Kit instead."*

This is **game theory applied to disaster relief** — maximizing lives saved with limited resources.

---

## ⛓️ How Blockchain Verification Works

```
1️⃣  Emergency message arrives
2️⃣  AI generates a decision (action + resource + priority)
3️⃣  Message is hashed using Keccak-256
4️⃣  Hash + decision stored on Monad blockchain via smart contract
5️⃣  Transaction hash (txHash) saved as proof

Later...

6️⃣  Click "Verify" → reads blockchain record
7️⃣  Compares on-chain data vs local database
8️⃣  ✅ Match = VERIFIED | ❌ Mismatch = COMPROMISED
```

### Try the Tamper Detection Demo

1. Submit an emergency from the dashboard or API
2. Click **"Tamper"** on any decision — this corrupts the local database
3. Click **"Verify"** — the blockchain catches the fraud! 🔍

---

## 🌐 Production Deployment

| Component | Deploy To | Command/Platform |
|-----------|-----------|-----------------|
| ⛓️ Blockchain | Monad Testnet | `npx hardhat run scripts/deploy.js --network monadTestnet` |
| 🤖 AI Agent | Render.com | Python Web Service, root: `ai/` |
| ⚙️ Backend | Render.com | Node Web Service, root: `backend/` |
| 🖥️ Dashboard | Vercel | Vite framework, root: `dashboard/` |
| 📱 Mobile | EAS Build | `eas build -p android --profile production` |

> See the full deployment guide in the repository docs.

---

## 📸 Screenshots

### Dashboard — Dark Mode
> Real-time coordination portal with emergency transmissions, resource gauges, mesh topology visualization, and blockchain audit ledger.

### Mobile App
> Field agent interface for sending emergency alerts, viewing transmissions, and checking AI decision records.

### Blockchain Verification
> Tamper-proof audit trail — simulate database corruption and verify integrity against on-chain records.

---

## 🧪 Running Tests

### Smart Contract Tests

```bash
cd blockchain
npx hardhat test
```

### Test Scenarios (Backend)

```bash
cd backend
node test_scenarios.js
```

---

## 📁 Environment Variables

### `backend/.env`

```env
PORT=5000
AI_SERVICE_URL=http://127.0.0.1:8000
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
GEMINI_API_KEY=your_gemini_api_key
```

### `ai/.env`

```env
GEMINI_API_KEY=your_gemini_api_key
```

### `blockchain/.env` (for Monad deployment)

```env
PRIVATE_KEY=your_wallet_private_key
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

---

## 🤝 Meet the Team

<table>
  <tr>
    <td align="center">
      <strong>Prince Maurya</strong><br/>
      <sub>Full-Stack Developer & Project Lead</sub><br/>
      <a href="https://github.com/Prince200510">
        <img src="https://img.shields.io/badge/GitHub-Prince200510-181717?style=flat-square&logo=github" />
      </a>
    </td>
    <td align="center">
      <strong>Prince Prajapati</strong><br/>
      <sub>Developer</sub><br/>
    </td>
    <td align="center">
      <strong>Pragesh</strong><br/>
      <sub>Developer</sub><br/>
    </td>
  </tr>
</table>

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## ⭐ Star This Repo!

If you found this project helpful or interesting, please consider giving it a ⭐ on GitHub. It helps us a lot!

---

<p align="center">
  <strong>Built with ❤️ during times when connectivity cannot be taken for granted.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made_with-❤️-ff1a1a?style=for-the-badge&labelColor=0a0a0a" />
</p>
