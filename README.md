# LiftFlow

Multi-user workout plan and progress tracker.

## Features

- Google sign-in
- Create and manage workout plans
- Browse an exercise library with posture guidance, safety notes, and references
- Track workout completion, weight, repetitions, sets, and notes
- Review progress history

## Tech Stack

- Next.js (App Router)
- TypeScript
- MongoDB Atlas + Mongoose
- Auth.js (NextAuth.js) with Google OAuth
- Tailwind CSS
- Recharts

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your credentials
4. Seed exercises: `curl -X PUT http://localhost:3000/api/exercises`
5. Run the dev server: `npm run dev`

## Deployment

Deploy to Vercel with the required environment variables:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
