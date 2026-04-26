# 🚀 AI Mock Interview & Resume Intelligence Platform

An advanced, AI-driven career preparation suite that combines real-time adaptive mock interviews with recruiter-level resume analysis. Built using **React 19**, **Gemini 2.0 Flash**, and **Firebase**, this platform helps candidates bridge the gap between their current profile and their dream job.

---

## ✨ Key Features

### 🎙️ AI Adaptive Mock Interview

* **Dynamic Questioning:** Leverages **Gemini 2.0 Flash** to generate questions based on the specific job role, difficulty level, and your uploaded resume.
* **Hybrid Interview Modes:** Supports both conceptual verbal questions and technical coding challenges with an integrated code editor.
* **Multidimensional Scoring:** Receive instant feedback on Technical Knowledge, Problem Solving, Communication, and Clarity.
* **Real-time Speech Recognition:** Built-in voice-to-text integration for a natural, hands-free interview experience.
* **Adaptive Difficulty:** The AI adjusts the complexity of the next question based on the quality of your previous answer.

### 📄 Resume Intelligence Analyzer

* **Semantic Alignment Score:** Calculates a 0–100 score based on how well your resume matches a provided job description.
* **ATS Risk Assessment:** Identifies "red flags" that might cause automated systems to filter out your application.
* **Skill Gap Analysis:** Highlights missing critical skills and suggests quantification improvements for low-impact bullet points.
* **Interview Bridging:** Automatically predicts likely interview questions and "challenge points" based on your background.

### 📊 Performance Tracking

* **Interview History:** Securely store and review past sessions using Firebase Firestore.
* **Growth Insights:** Track improvement across different skill dimensions over time.
* **Study Recommendations:** Get a generated list of "Brush-up Topics" customized to your interview performance.

---

## 🛠️ Tech Stack

* **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
* **Styling:** Modern Vanilla CSS (Custom UI Components)
* **Backend/Database:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)
* **AI Engine:** [Gemini 2.0 Flash](https://deepmind.google/technologies/gemini/) (via [OpenRouter](https://openrouter.ai/))
* **API Security:** [Vercel Serverless Functions](https://vercel.com/docs/functions) (Backend Proxy)

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** (Latest LTS)
* **Firebase Account** (for Auth and Database)
* **OpenRouter API Key** (for Gemini access)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/ai-mock-interview.git
cd ai-mock-interview
```

2. **Environment Configuration:**

Create a `.env` file in the root directory and add:

```env
# Firebase Setup
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenRouter / Gemini Setup
OPENROUTER_API_KEY=your_openrouter_api_key
```

3. **Run the development server:**

```bash
npm run dev
```

---

## 🏗️ Project Structure

* `api/proxy.ts` — Vercel Serverless Function to keep API keys secure
* `components/` — Reusable UI components (Interview Controller, Header, etc.)
* `pages/` — Core views: Resume Analyzer, Interview Engine, Dashboard, History
* `services/` — Firebase initialization and AI orchestration logic
* `hooks/` — Custom React hooks (speech recognition, UI logic)

---

## 🛡️ Security & Privacy

* **API Protection:** Uses a backend proxy (`/api/proxy`) to prevent exposing OpenRouter API keys.
* **Data Handling:** Resume files are processed in-memory and not stored permanently unless saved by the user.
