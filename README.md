# 🌉 SignBridge — Edge-Native Offline ISL Recognition & Communication Bridge

> **Real-Time Zero-Cloud Indian Sign Language (ISL) Recognition, Live Sentence Builder, Two-Way Speech-to-Sign Bridge, and Edge Database Architecture.**

---

## 🌟 Key Features

- **🔒 100% Offline Edge-Native Vision**: Zero server/cloud reliance. All MediaPipe landmark extraction, scale-invariant kinematics normalization, and classifiers run in the client browser.
- **⚡ Sub-35ms Real-Time Inference**: Smooth 30 FPS tracking with pre-allocated typed arrays (`Float32Array`) and zero-allocation circular ring buffers.
- **🤟 30 Core ISL Signs**: Covers Emergency, Needs, Campus/Academics, Greetings, and Actions with continuous joint angle kinematics ($MCP \to PIP \to DIP \to TIP$).
- **🗣️ Offline Text-to-Speech (TTS)**: Built-in speech synthesis with automatic Indian English voice matching and priority emergency preemption (`HELP`, `MEDICINE`, `HOSPITAL`, `POLICE`, `DANGER`).
- **🔄 Two-Way Communication Bridge**: Translates spoken English from hearing users via Web Speech API NLP parsing into visual ISL sequence flashcards for signers.
- **💾 Local IndexedDB Edge Storage**: Automatic session logging, telemetry analytics, and single-click JSON dataset export for audits.
- **🎓 Practice Arena**: Interactive sign mastery trainer with real-time frame holding verification.

---

## 🏗️ Architecture Pipeline

```
[Webcam Feed (30 FPS)]
        │
        ▼
[MediaPipe Hands & Upper Pose] ── (21 Hand Landmarks + 33 Upper Pose)
        │
        ▼
[Scale-Invariant 63D Normalizer] ── (Wrist Origin + Span Scaling + Joint Angle Trigonometry)
        │
        ▼
[Pre-Allocated FIFO Ring Buffer] ── (30 Frames Temporal Memory + 3D Velocity Vectoring)
        │
        ▼
[Dual Heuristic + Kinematics Classifier] ── (Static & Dynamic Multi-Tier Fuzzy Matcher)
        │
        ▼
[Sliding-Window Majority Stabilizer] ── (10-Prediction Window + 70% Majority + 1.2s Cooldown)
        │
        ├──► [Live Canvas Skeletal HUD (60 FPS)]
        ├──► [Live Sentence Token Stream Builder]
        ├──► [Offline Speech Synthesis Engine]
        └──► [IndexedDB Local Edge Database]
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## ☁️ Deploying to Vercel

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SignBridge Edge-Native ISL MVP"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New..."** ➔ **"Project"**.
3. Import your `SignBridge` repository.
4. Framework Preset: **Next.js** (Auto-detected).
5. Click **Deploy**.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict type checking)
- **Styling**: Tailwind CSS & Lucide React
- **State Management**: Zustand
- **Computer Vision**: Google MediaPipe Hands & Pose
- **Audio & Speech**: Web Audio API & Web Speech API
- **Persistence**: IndexedDB (Browser Native)

---

## 📄 License
MIT License. Built for accessibility and inclusive communication.
