# 🏥 SmartCare AI

An AI-powered clinical operations platform and doctor-patient registry designed to streamline modern healthcare centers. **SmartCare AI** integrates a highly polished **React 19** frontend, an **Express** server, and **Google Gemini AI** to provide advanced clinical diagnostics helpers, real-time triage queue predictions, automated medical report summaries, and a comprehensive hospital management dashboard.

---

## 🚀 Key Features

### 📊 Clinical Dashboard
* **Real-time Analytics**: Displays patient volume, waiting queues, active doctors, and pending appointments.
* **Integrative Roster Graphs**: Provides instant visibility into clinic status and patient transit flows.

### 👥 Registry Management
* **Doctor Directory**: Manage doctor listings, medical specialties, active/inactive statuses, and current room assignments.
* **Patient & Medical Records**: Fully track detailed patient profiles, update historic medical records, and save structured physician notes.
* **Interactive Appointments**: Book, schedule, reschedule, and manage statuses (Scheduled, Confirmed, Cancelled, Completed) for patient-physician visits.

### ⏱️ Smart Triage & Queue coordinator
* **Caseload Calling**: Interactive, server-authoritative clinical queue controller allowing triage staff to call the next patient, skip candidates, or simulate triage workflows.
* **Dynamic Wait Metrics**: Live updates of patient indices and queue tracking.

### 🧠 Gemini AI Copilot Integration
* **Symptom Checker**: Deep-dives into user-described symptoms to flag potential conditions, triage advice, diagnostic guidelines, and urgency rankings (Low, Medium, High).
* **Doctor Recommendation Engine**: Automatically aligns patient symptom checkers with matching on-duty medical specialties and coordinates doctor referrals.
* **Caseload Transit Predictor**: Utilizes local queue analytics to predict transit and waiting times for incoming patients using advanced contextual models.
* **Medical Report Summarizer**: Analyzes medical reports, transcripts, and charts to synthesize high-impact structured summaries containing diagnoses, medication lists, and next steps.
* **Hospital Chatbot Assistant**: Interactive chat interface for clinical practitioners to fetch instantaneous guidelines, general medical advice, or search historic cases.

---

## 🛠️ Technology Stack

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion, Lucide Icons | Premium high-contrast responsive interfaces featuring dark-mode aesthetic, smooth entry transitions, and tactile interfaces. |
| **Backend** | Node.js, Express, `tsx` | Robust middleware and routing structure handling auth verification and managing medical data registries. |
| **AI Integration** | `@google/genai` (SDK v2) | Deep context generation, smart health summarization, and interactive chat powered by Google Gemini models. |
| **Database** | Structured Local File Persistence | High-fidelity JSON-based storage (`database.json`) acting as a portable, zero-overhead clinical mock engine with session storage tokens. |
| **Build & Tooling** | `esbuild`, Vite Compiler | Bundle optimization and high-speed compilation, enabling Standalone Production start scripts. |
| **Deployment** | Vercel Serverless Architecture | Configured specifically for multi-route proxy serverless function execution via `vercel.json` routing rules. |

---

## 📂 File & Code Directory Structure

```text
├── 📁 api/                  # Vercel Serverless Functions Entrypoint
│   └── index.ts             # Imports and exports Express app for serverless execution
├── 📁 assets/               # Static media and brand elements
├── 📁 src/                  # React Frontend Application (TypeScript)
│   ├── 📁 components/       # Reusable UI & Layout Components
│   │   ├── AIAssistant.tsx          # Medical assistant Chat interface
│   │   ├── AIReportSummarizer.tsx   # PDF and transcript summarizer UI
│   │   ├── AISymptomChecker.tsx     # Symptom analysis and recommendations board
│   │   ├── Appointments.tsx         # Appointments booking manager UI
│   │   ├── Auth.tsx                 # Portal registration and secure login screen
│   │   ├── Dashboard.tsx            # Clinical metrics and active registries overview
│   │   ├── Doctors.tsx              # Roster management panel
│   │   ├── MedicalRecords.tsx       # Historic health chart editor
│   │   ├── Queue.tsx                # Real-time queue controller UI
│   │   └── Sidebar.tsx              # Adaptive navigation layout
│   ├── App.tsx              # Main App Controller (routing, theme coordination, global states)
│   ├── index.css            # Tailwind CSS Global Styles and theme variables
│   ├── main.tsx             # Frontend DOM hydration entrypoint
│   └── types.ts             # Global strictly typed interfaces
├── .env.example             # Documented Template for Environment Keys
├── database.json            # Structured Mock DB storage (Doctors, Records, Users)
├── metadata.json            # Project application permissions and description
├── package.json             # NPM package scripts and workspace configurations
├── server.ts                # Express REST Server Engine
├── tsconfig.json            # TypeScript engine definitions
├── vercel.json              # Vercel serverless function and static CDN rewrites config
└── vite.config.ts           # Vite Bundler configurations (including Tailwind CSS plugins)
```

---

## 🔄 Architecture & Runtime Flows

### 1. Unified Routing Configuration (`vercel.json`)
SmartCare AI is architected to operate under a singular unified routing tree. Vercel is instructed to proxy all incoming routes under `/` to either serve static frontend files, or delegate dynamic route mapping gracefully:
- Client-side static routing fallback behaves as an SPA, sending standard page structures to `index.html`.
- For Serverless Execution on Vercel, the backend function maps and listens directly to API controllers.

### 2. Live Local Server vs. Serverless Production
- **Local Development (`npm run dev`)**: The Express server is instantiated natively via `tsx` on local port `3000`. The server spins up a Vite Dev Instance, using Vite middlewares to inject real-time asset updates to your browser.
- **Vercel Serverless Function Execution**: Express's `app.listen()` call is completely isolated to ensure it only triggers under standard non-serverless platforms. On Vercel, Vercel loads `api/index.ts` which exports the raw Express `app` instance, allowing Vercel’s runtime to handle HTTP events dynamically without spinning up a persistent Node background listener.

---

## 🔑 Environment Setup

To enable the AI capabilities of SmartCare AI, make sure you configure your Google Gemini API key.

1. **Local Setup**: Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
2. **Production Setup (Vercel)**: Add the `GEMINI_API_KEY` to your Vercel Project Settings as an Environment Variable.

*Note: SmartCare AI provides a complete clinical diagnostics mock mode if the API key is missing, enabling a fully functional offline-first showcase.*

---

## 💻 Local Development

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **NPM** (v9 or higher recommended)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Development Mode
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`. The Vite bundler and local Express dev server will serve the application with hot reloading active.

### Step 3: Run Linter Checks
Ensure type-safety guidelines and linter policies are maintained:
```bash
npm run lint
```

### Step 4: Standalone Production Compilation
Compiles the React frontend static artifacts to `dist/`, and packages the backend Express server into a bundled standalone CommonJS file using `esbuild`:
```bash
npm run build
```
Once built, you can run the final bundled production workspace locally using:
```bash
npm run start
```
