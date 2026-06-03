# 🧠 AI Second Brain

A personal knowledge management app powered by AI. Save notes, PDFs, and URLs — then chat with your knowledge base using natural language.

![AI Second Brain](https://img.shields.io/badge/React-18-blue?logo=react) ![Firebase](https://img.shields.io/badge/Firebase-10-orange?logo=firebase) ![Groq](https://img.shields.io/badge/AI-Groq%20%7C%20Llama%203-green) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)

---

## ✨ Features

- 📝 **Save Notes** — Text, PDF uploads, and URLs in one place
- 🤖 **AI Analysis** — Auto-generates summaries and tags for every note using Llama 3
- 💬 **Chat with your notes** — Ask anything about your saved knowledge in natural language
- 🔗 **Related Notes** — AI finds connections between your notes automatically
- 📊 **Dashboard** — Stats overview and weekly AI digest of your learning
- 🔐 **Google Auth** — Secure sign-in with Firebase Authentication
- ☁️ **Cloud Sync** — All notes stored in Firestore, accessible anywhere

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore |
| AI | Groq API (Llama 3.3 70B) |
| State | Zustand |
| Routing | React Router v6 |
| PDF Parsing | pdfjs-dist (local, no upload) |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/harish-lab01/Second-Brain.git
cd Second-Brain
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GROQ_API_KEY=your_groq_api_key
```

### 3. Get your API keys

- **Firebase** — [console.firebase.google.com](https://console.firebase.google.com) → Create project → Enable Firestore + Google Auth
- **Groq** — [console.groq.com](https://console.groq.com) → API Keys → Create key (free, no credit card)

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
src/
├── components/
│   ├── chat/          # ChatPanel, ChatMessage, ChatInput
│   ├── dashboard/     # StatsCard
│   ├── layout/        # Layout, Sidebar, Header
│   ├── notes/         # NoteCard, NoteList, NoteDetail, AddNoteModal
│   └── ui/            # Toast, TagChip, EmptyState, LoadingSkeleton
├── hooks/
│   ├── useAuth.js     # Firebase auth state
│   ├── useNotes.js    # CRUD + AI analysis
│   └── useChat.js     # Chat with notes
├── pages/
│   ├── Dashboard.jsx
│   ├── Notes.jsx
│   ├── NoteDetailPage.jsx
│   ├── Chat.jsx
│   └── Login.jsx
├── services/
│   ├── firebase.js    # Firebase init
│   ├── firestore.js   # Firestore CRUD
│   ├── gemini.js      # AI service (Groq)
│   └── storage.js     # Firebase Storage
├── store/
│   └── useStore.js    # Zustand global state
└── utils/
    ├── helpers.js     # Date, tag, truncate utils
    └── pdfParser.js   # Local PDF text extraction
```

---

## 🔒 Firebase Setup

1. Enable **Google Sign-In** in Firebase Console → Authentication → Sign-in methods
2. Create **Firestore** database in production mode
3. Add these **Firestore indexes** (required for compound queries):
   - Collection `notes`: fields `userId ASC, createdAt DESC`
   - Collection `chats`: fields `userId ASC, createdAt DESC`

---

## 📦 Build & Deploy

```bash
npm run build
```

Deploy to Vercel — the `vercel.json` SPA rewrite config is already included.

---

## 📄 License

MIT — free to use and modify.
