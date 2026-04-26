    1 # 🚀 AI Mock Interview & Resume Intelligence Platform
    2
    3 An advanced, AI-driven career preparation suite that combines real-time adaptive mock interviews with
      recruiter-level resume analysis. Built using **React 19**, **Gemini 2.0 Flash**, and **Firebase**, this platform
      helps candidates bridge the gap between their current profile and their dream job.
    4
    5 ---
    6
    7 ## ✨ Key Features
    8
    9 ### 🎙️ AI Adaptive Mock Interview
   10 *   **Dynamic Questioning:** Leverages **Gemini 2.0 Flash** to generate questions based on the specific job role,
      difficulty level, and your uploaded resume.
   11 *   **Hybrid Interview Modes:** Supports both conceptual verbal questions and technical coding challenges with an
      integrated code editor.
   12 *   **Multidimensional Scoring:** Receive instant feedback on Technical Knowledge, Problem Solving, Communication,
      and Clarity.
   13 *   **Real-time Speech Recognition:** Built-in voice-to-text integration for a natural, hands-free interview
      experience.
   14 *   **Adaptive Difficulty:** The AI adjusts the complexity of the next question based on the quality of your
      previous answer.
   15
   16 ### 📄 Resume Intelligence Analyzer
   17 *   **Semantic Alignment Score:** Calculates a 0-100 score based on how well your resume matches a provided job
      description.
   18 *   **ATS Risk Assessment:** Identifies "red flags" that might cause automated systems to filter out your
      application.
   19 *   **Skill Gap Analysis:** Highlights missing critical skills and suggests quantification improvements for
      low-impact bullet points.
   20 *   **Interview Bridging:** Automatically predicts likely interview questions and "challenge points" based on your
      specific background.
   21
   22 ### 📊 Performance Tracking
   23 *   **Interview History:** Securely store and review past sessions using Firebase Firestore.
   24 *   **Growth Insights:** Track improvement across different skill dimensions over time.
   25 *   **Study Recommendations:** Get a generated list of "Brush-up Topics" customized to your interview performance.
   26
   27 ---
   28
   29 ## 🛠️ Tech Stack
   30
   31 - **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/),
      [Vite](https://vitejs.dev/)
   32 - **Styling:** Modern Vanilla CSS (Custom UI Components)
   33 - **Backend/Database:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)
   34 - **AI Engine:** [Gemini 2.0 Flash](https://deepmind.google/technologies/gemini/) (via
      [OpenRouter](https://openrouter.ai/))
   35 - **API Security:** [Vercel Serverless Functions](https://vercel.com/docs/functions) (Backend Proxy)
   36
   37 ---
   38
   39 ## 🚀 Getting Started
   40
   41 ### Prerequisites
   42 - **Node.js** (Latest LTS)
   43 - **Firebase Account** (for Auth and Database)
   44 - **OpenRouter API Key** (for Gemini access)
   45
   46 ### Installation
   47
   48 1.  **Clone the repository:**
      git clone https://github.com/your-username/ai-mock-interview.git
      cd ai-mock-interview
   1
   2 3.  **Environment Configuration:**
   3     Create a `.env` file in the root directory and add your credentials:
  Firebase Setup
      VITE_FIREBASE_API_KEY=your_api_key
      VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
      VITE_FIREBASE_PROJECT_ID=your_project_id
      VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
      VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
      VITE_FIREBASE_APP_ID=your_app_id

  OpenRouter/Gemini Setup
      OPENROUTER_API_KEY=your_openrouter_api_key
   1
   2 4.  **Run the development server:**
      npm run dev

    1
    2 ---
    3
    4 ## 🏗️ Project Structure
    5
    6 - `api/proxy.ts` - Vercel Serverless Function to keep API keys secure.
    7 - `components/` - Reusable UI components (Interview Controller, Header, etc.).
    8 - `pages/` - Core views: Resume Analyzer, Interview Engine, Dashboard, and History.
    9 - `services/` - Logic for Firebase initialization and AI service orchestration.
   10 - `hooks/` - Custom React hooks for speech recognition and UI logic.
   11
   12 ---
   13
   14 ## 🛡️ Security & Privacy
   15 - **API Protection:** This project uses a backend proxy (`/api/proxy`) to ensure your OpenRouter API keys are
      never exposed on the client side.
   16 - **Data Handling:** Resume files are processed in-memory for analysis and are not stored permanently unless a
      session is explicitly saved to your history.
   17
   18 ---
   19
   20 ## 🤝 Contributing
   21 Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any
      contributions you make are **greatly appreciated**.
   22
   23 1. Fork the Project
   24 2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
   25 3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
   26 4. Push to the Branch (`git push origin feature/AmazingFeature`)
   27 5. Open a Pull Request
   28
   29 ---
   30
   31 ## 📄 License
   32 Distributed under the MIT License. See `LICENSE` for more information.
   33
   34 ---
   35 <div align="center">
   36   Built with ❤️ for better career outcomes.
   37 </div>
