# 🍋 Lime++ Frontend

Frontend dashboard for Lime++ - A contribution verification and evaluation system.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Data Fetching:** TanStack Query v5
- **Auth:** NextAuth.js
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

## Prerequisites

- [Node.js 18+](https://nodejs.org/)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Update the values as needed.

### 3. Run the App

```bash
# Development mode
npm run dev

# Production build
npm run build && npm run start
```

The app will be available at **http://localhost:3000**

## Available Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Build for production                     |
| `npm run start` | Start production server                  |
| `npm run lint`  | Lint the codebase                        |

## Environment Variables

| Variable               | Description         | Example                    |
| ---------------------- | ------------------- | -------------------------- |
| `NEXT_PUBLIC_API_URL`  | Backend API URL     | `http://localhost:3001`    |
| `NEXTAUTH_URL`         | NextAuth base URL   | `http://localhost:3000`    |
| `NEXTAUTH_SECRET`      | NextAuth secret key | (generate a random string) |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App ID | (from GitHub)              |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | (from GitHub)              |

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # React components
│   └── ui/             # shadcn/ui components
└── lib/
    └── utils.ts        # Utility functions

public/                 # Static assets
```

## Adding shadcn/ui Components

```bash
# Add a button component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add card dialog dropdown-menu

# See all available components
npx shadcn@latest add --help
```

## Running with Backend

For full functionality, run the backend simultaneously:

```bash
# Terminal 1 - Backend
cd ../backend
docker-compose up -d
npm run start:dev

# Terminal 2 - Frontend
cd ../frontend
npm run dev
```

## Troubleshooting

### Port 3000 already in use

```bash
# Kill the process using port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Module not found errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### TypeScript errors

```bash
# Regenerate types
npm run build
```
