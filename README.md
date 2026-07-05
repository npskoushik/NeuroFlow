# NexHMI — Intelligent Control Interface

Next-generation AI-powered HMI platform built for ABB Hackathon.

## Prerequisites (Install These First)

1. **Node.js v18+** → https://nodejs.org (download LTS version)
2. **VS Code** → https://code.visualstudio.com
3. **Git** (optional) → https://git-scm.com

## Setup Steps

```bash
# 1. Extract this zip folder somewhere on your computer

# 2. Open folder in VS Code
#    File → Open Folder → select 'nexhmi'

# 3. Open terminal in VS Code
#    View → Terminal  (or Ctrl + `)

# 4. Install dependencies
npm install

# 5. Start development server
npm run dev

# 6. Open browser
#    http://localhost:5173
```

## VS Code Extensions (Recommended)

Install these from VS Code Extensions tab:
- **ES7+ React/Redux/React-Native snippets** (dsznajder)
- **Tailwind CSS IntelliSense** (Bradlc)
- **TypeScript + JavaScript** (already built-in)
- **Prettier** (code formatter)

## Project Structure

```
nexhmi/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx       ← Top navigation bar
│   │   │   ├── Sidebar.tsx      ← Left navigation
│   │   │   └── AIPanel.tsx      ← Right AI chat panel
│   │   └── dashboard/
│   │       ├── KPICards.tsx     ← 4 stat cards at top
│   │       ├── MachineCard.tsx  ← Individual machine cards
│   │       ├── AlarmPanel.tsx   ← AI-prioritized alarm list
│   │       └── TrendChart.tsx   ← Live sensor trend chart
│   ├── pages/
│   │   └── Dashboard.tsx        ← Main dashboard page
│   ├── data/
│   │   └── dummyData.ts         ← Fake machine/sensor data
│   ├── types/
│   │   └── index.ts             ← TypeScript interfaces
│   ├── App.tsx                  ← Root layout
│   ├── main.tsx                 ← Entry point
│   └── index.css                ← Global styles
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Current Phase: Phase 1 (UI Skeleton)

All data is hardcoded in `src/data/dummyData.ts`.

Next phases will add:
- Phase 2: Live sensor simulator
- Phase 3: Rule-based alarm engine
- Phase 4: Firebase backend
- Phase 5: Gemini AI integration
- Phase 6: AI Setup Wizard

## Tech Stack

| Layer      | Technology        |
|------------|-------------------|
| Frontend   | React + TypeScript |
| Styling    | Tailwind CSS       |
| Charts     | Recharts           |
| Icons      | Lucide React       |
| Build Tool | Vite               |
