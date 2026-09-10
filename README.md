# LiftFlow

Multi-user workout plan and progress tracker with comprehensive exercise guidance.

## Features

- **Google Sign-In**: Secure authentication via OAuth
- **Workout Planning**: Create and manage personalized workout plans
- **Exercise Library**: Browse the 24 seeded exercises with form guides, safety notes, breathing techniques, and references
- **Progress Tracking**: Log sessions and monitor strength improvements
- **Responsive Design**: Desktop sidebar navigation and mobile bottom navigation for seamless experience across all devices
- **Always Discoverable**: Exercise library accessible to all users, authenticated or not

## Navigation

### Desktop
- Fixed left sidebar (240px) with main navigation
- Links: Dashboard, Plans, Exercises, Progress, Settings
- Exercises always available; authenticated-only links hidden when signed out

### Mobile
- Sticky header with app logo and user menu
- Fixed bottom navigation bar (44px touch targets, safe-area support)
- Responsive grid layouts for all content

## Authentication & Logout

- Sign in with Google via landing page or mobile/desktop header
- Sign out with proper error handling and user feedback
- Logout clears cached private screens via full page reload
- Settings page shows signed-out state for unauthenticated users

## Tech Stack

- Next.js 14.2.5 (App Router)
- React 18.3.1
- TypeScript 5.5.2
- MongoDB Atlas + Mongoose
- Next-Auth 4.24.7 with Google OAuth
- Tailwind CSS 3.4.4
- Lucide React Icons 0.395.0
- Jest 29.7.0 with React Testing Library

## Color Scheme

- **Charcoal** (#111312): Primary background
- **Panel** (#191d19): Cards and secondary backgrounds
- **Lime** (#c5f36b): Primary accent (high contrast on dark backgrounds)
- **Slate**: Full palette for text hierarchy and muted elements

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your credentials:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL`
4. Run the dev server: `npm run dev`
5. In another terminal, seed exercises: `curl -X PUT http://localhost:3000/api/exercises`
6. Open http://localhost:3000

## Testing

Run tests:
```bash
npm run test              # Run all tests
npm run test -- --watch  # Watch mode
npm run test -- --testPathPattern=ui  # UI tests only
```

Tests cover:
- Navigation with AppShell and responsive layouts
- Exercise list display and filtering
- Sign out flow with error handling and recovery
- Component integration with Next.js hooks

## Deployment

Deploy to Vercel with the required environment variables:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`

## Development Notes

- Exercise reference content is educational only and does not replace professional instruction
- Technique varies by equipment and individual factors; trainer demonstration recommended
- Component library uses Tailwind utilities with preset button, input, and card styles
- Main navigation and form controls use large touch targets
- Focus indicators and reduced-motion styles are included

This is a local development application, not a production-ready release. Production deployment still requires resolving the existing repository TypeScript errors and reviewing authorization on all data endpoints. The UI regression tests mock authentication; they do not complete a live Google OAuth login.
