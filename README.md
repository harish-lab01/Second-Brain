# 🧠 AI Second Brain

A full-featured personal knowledge management app powered by AI. Save notes, PDFs, and URLs — then chat with your knowledge, review it with spaced repetition, explore connections visually, and search semantically.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-10-orange?logo=firebase)
![Groq](https://img.shields.io/badge/AI-Groq%20%7C%20Llama%203-green)
![HuggingFace](https://img.shields.io/badge/Embeddings-HuggingFace-yellow)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)
![PWA](https://img.shields.io/badge/PWA-ready-purple)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📝 **Notes** | Save text, PDFs, and URLs. AI auto-generates summaries + tags for every note |
| 🎙️ **Voice Input** | Dictate notes and chat messages using Web Speech API |
| 📋 **Templates** | 6 structured templates: Book Summary, Meeting Notes, Research, Journal, and more |
| 📥 **Import** | Drag-and-drop `.md` files from Notion or Obsidian — bulk import with AI analysis |
| 💬 **AI Chat** | Chat with your knowledge base using natural language. Groq Llama 3 answers from your notes |
| 🔍 **Semantic Search** | AI-powered search using HuggingFace embeddings — finds notes by meaning, not just keywords |
| 📁 **Collections** | Organise notes into colour-coded notebooks |
| 🕸️ **Knowledge Graph** | Interactive force-directed graph of all your notes and their connections |
| 🃏 **Spaced Repetition** | Daily review flashcards using the SM-2 algorithm |
| 🔗 **Note Connections** | After saving, AI proactively surfaces related notes from your knowledge base |
| 🌐 **Public Sharing** | Share any note publicly via a shareable link |
| 📊 **Dashboard** | Stats, weekly AI digest, and quick actions |
| ☁️ **Real-time Sync** | Firestore `onSnapshot` — notes update live across all devices |
| 📱 **PWA** | Install as a mobile app. Works offline with service worker caching |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS (dark glassmorphism) |
| Auth | Firebase Authentication (Google) |
| Database | Cloud Firestore (real-time) |
| AI Chat | Groq API — Llama 3.3 70B |
| AI Embeddings | HuggingFace Inference API — `all-MiniLM-L6-v2` |
| State | Zustand |
| Routing | React Router v6 |
| Graph | react-force-graph-2d |
| PDF Parsing | pdfjs-dist (local — no upload) |
| PWA | vite-plugin-pwa + Workbox |

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/second-brain.git
cd second-brain
npm install
```

### 2. Create your `.env` file

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Groq (required — free, no credit card)
# Get at: https://console.groq.com → API Keys
VITE_GROQ_API_KEY=gsk_...

# HuggingFace (required for semantic search — free)
# Get at: https://huggingface.co/settings/tokens → New token (Read)
VITE_HF_API_KEY=hf_...
```

### 3. Configure Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Sign-In**: Authentication → Sign-in methods → Google
3. Create a **Firestore** database
4. Add these **Firestore composite indexes** (required — without these, queries will fail):

| Collection | Fields |
|---|---|
| `notes` | `userId ASC` + `createdAt DESC` |
| `chats` | `userId ASC` + `createdAt DESC` |
| `reviews` | `userId ASC` + `reviewedAt DESC` |
| `collections` | `userId ASC` + `createdAt ASC` |

5. Set **Firestore Security Rules** — paste these into Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Notes — owners can read/write; anyone can read public notes
    match /notes/{noteId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow read: if resource.data.isPublic == true;  // for public sharing
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Chats, reviews, collections — private to owner only
    match /chats/{docId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /reviews/{docId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    match /collections/{docId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

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
│   ├── chat/          # ChatPanel, ChatMessage, ChatInput (voice)
│   ├── dashboard/     # StatsCard
│   ├── graph/         # KnowledgeGraph (force-directed)
│   ├── layout/        # Layout, Sidebar, Header
│   ├── notes/         # NoteCard, NoteList, NoteDetail, AddNoteModal (templates),
│   │                  # EditNoteModal, ImportModal, NoteConnectionsBanner
│   └── ui/            # Toast, TagChip, EmptyState, LoadingSkeleton, VoiceButton
├── hooks/
│   ├── useAuth.js        # Firebase auth state
│   ├── useChat.js        # Chat with notes + rate limiting
│   ├── useCollections.js # Collection CRUD
│   ├── useNotes.js       # Notes CRUD + real-time + pagination + AI + embeddings
│   ├── useRateLimit.js   # localStorage-based API rate limiter
│   └── useVoice.js       # Web Speech API hook
├── pages/
│   ├── Dashboard.jsx
│   ├── Notes.jsx         # Semantic search + import + connections banner
│   ├── NoteDetailPage.jsx
│   ├── Collections.jsx
│   ├── Chat.jsx
│   ├── Graph.jsx         # Knowledge graph page
│   ├── Review.jsx        # Spaced repetition
│   ├── SharePage.jsx     # Public note view (no auth required)
│   └── Login.jsx
├── services/
│   ├── firebase.js    # Firebase init (Auth + Firestore)
│   ├── firestore.js   # All Firestore operations
│   ├── gemini.js      # AI service (Groq Llama 3 — named gemini.js for compatibility)
│   └── embeddings.js  # HuggingFace embeddings + cosine similarity + hybrid search
├── store/
│   └── useStore.js    # Zustand global state (notes, collections, toast)
└── utils/
    ├── helpers.js         # Date, tag, truncate utilities
    ├── markdownImporter.js # .md file parser for Notion/Obsidian import
    ├── pdfParser.js       # Local PDF text extraction
    ├── sm2.js             # SM-2 spaced repetition algorithm
    └── templates.js       # 6 note templates
```

---

## 📦 Build & Deploy

```bash
npm run build
```

Deploy to Vercel — `vercel.json` SPA rewrite is already configured.

The app is PWA-ready. After deploying, users can install it on their phone from the browser's "Add to Home Screen" prompt.

---

## ⚡ Rate Limits

The app protects your API budget with client-side rate limiting:

| API | Limit | Window |
|---|---|---|
| Groq (chat) | 40 messages | 1 hour |
| Groq (note analysis) | 60 analyses | 1 hour |

Limits are stored in `localStorage`. If exceeded, the app degrades gracefully — notes still save, just without AI summary.

---

## 🔒 Security Notes

- PDF text is extracted **locally** — no file is uploaded to any server
- Notes are private by default — only the owner can read them
- Public sharing requires the owner to explicitly enable it per note
- API keys are in `.env` (Vite `VITE_` prefix — exposed to the browser). For production, consider a backend proxy if you want to keep keys server-side

---

## 📄 License

MIT — free to use and modify.
