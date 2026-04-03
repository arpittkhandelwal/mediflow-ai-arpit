# MediFlow AI - Smart Healthcare for Every Indian 🇮🇳

MediFlow AI is an empathetic, AI-driven healthcare management platform designed to make clinical care accessible and effortless across India. With features like multilingual voice commands, AI-powered symptom checking, and intelligent prescription scanning, MediFlow bridges the gap between patients and providers.

## 🚀 Key Features

*   **🎙️ 'Asha' AI Voice Assistant:** Multilingual support (Hindi & English), enabling natural language health interactions.
*   **🩺 AI Symptom Checker:** Get accurate preliminary diagnosis instantly using advanced LLMs (powered by Groq).
*   **📄 Prescription Scanner:** Digitize handwritten medical notes in seconds using OCR and AI extraction.
*   **🚨 Emergency SOS:** One-tap emergency alert system that automatically notifies contacts and nearby hospitals.
*   **👨‍⚕️ Intelligent Doctor Dashboard:** AI patient summaries, appointment queue management, and deep healthcare insights for providers.
*   **📅 Smart Appointments:** Book verified top doctors nearby with zero hassle.

## 🛠 Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, Framer Motion
*   **Backend:** Node.js, Express.js
*   **Database & Auth:** Supabase (PostgreSQL)
*   **AI Engine:** Groq (Llama-3 models)
*   **Cloud Hosting:** Google Cloud Run

## 📥 Local Development

### Prerequisites
*   Node.js (v18 or higher)
*   Supabase project (with authentication enabled)
*   Groq API Key

### Backend Setup
```bash
cd backend
npm install
# Ensure you have a .env file with process.env.PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
npm run dev
```

### Frontend Setup
```bash
cd frontend-app
npm install
# Ensure you have a .env file with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

## 🎨 Design Philosophy
The system moves away from cold SaaS aesthetics to **"The Digital Sahayak" (The Digital Helper)**—featuring warm, high-contrast UI, soft depth, and an intuitive "High-End Editorial" feel designed to comfort users while navigating health data.

---
*Care with Empathy. नमस्ते।*
