# Live Bidding Arena

A full-stack real-time bidding room web application. No database required. Everything runs live in-memory.

## Features
- Create private rooms with a custom title, starting balance, timer, and max balance.
- Invite users with a custom URL link or QR code.
- Host can add new items to bid on continuously.
- Live animated dashboard showing highest bid, active leaderboard, and live activity feed.
- Host controls: pause, resume, force end, change timers.
- Beautiful UI with neon glow, glassmorphism, and framer-motion animations.
- Bidders can quickly place bids or type custom amounts. Balance deducted in real-time.
- Confetti celebration upon winning.

## Tech Stack
**Frontend:** React.js + Vite, Tailwind CSS, Framer Motion, Socket.io Client
**Backend:** Node.js, Express.js, Socket.io (In-memory store)

## Development Setup

1. **Backend:**
   \`\`\`bash
   cd backend
   npm install
   node server.js
   \`\`\`
   Backend runs on `http://localhost:4000`

2. **Frontend:**
   \`\`\`bash
   cd frontend
   npm install
   npm run dev
   \`\`\`
   Frontend runs on Vite dev server (usually `http://localhost:5173`)

## Deployment
- **Frontend (Vercel):** Point the build command to `npm run build` and output folder to `dist`. Add `VITE_BACKEND_URL` in Vercel environment variables pointing to your backend URL.
- **Backend (Render/Railway):** Deploy the `backend` folder as a Node.js web service. Ensure the command is `node server.js` and PORT environment variable is exposed.
# bidding
