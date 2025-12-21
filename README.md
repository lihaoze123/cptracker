# CPTracker

[![Github Stars](https://img.shields.io/github/stars/lihaoze123/cptracker)](https://github.com/lihaoze123/cptracker)
[![GitHub Release](https://img.shields.io/github/v/release/lihaoze123/cptracker)](https://github.com/lihaoze123/cptracker/releases/latest)
[![GitHub last commit (dev branch)](<https://img.shields.io/github/last-commit/lihaoze123/cptracker/main?label=last%20commit%20(main%20branch)>)](https://github.com/lihaoze123/cptracker/commits/main/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/lihaoze123/cptracker)

A modern, full-stack dashboard for tracking competitive programming progress. Record solved problems, visualize your activity with interactive charts and heatmaps, organize solutions with Markdown and LaTeX support, import directly from popular OJ platforms, and optionally sync your data to the cloud with multi-device access.

## Features

### Core Features
- **Problem Tracking** - Log problems with URL, difficulty rating, solution notes, and tags
- **Interactive Statistics** - Visualize your progress with dynamic charts showing problems solved by difficulty, platform distribution, and daily activity trends
- **Activity Heatmaps** - Visualize daily problem count and max difficulty over time with year-by-year breakdown
- **Overview Dashboard** - Get instant insights with key statistics, recent activity, and performance trends
- **Advanced Data Table** - Filter by source/tags/difficulty/date, sort, and search through your problem history with bulk operations support
- **Rich Text Solutions** - Write solutions with Markdown, LaTeX math, and syntax-highlighted code blocks
- **Public Solution Sharing** - Share individual solutions via unique public URLs with route-based sharing (`/:username/solutions/:solutionId`)
- **CSV Import/Export** - Backup and restore your data easily
- **OJ Import** - Import problems directly from Codeforces, AtCoder, Luogu (洛谷), and other OJ platforms with automatic difficulty conversion

### Cloud Sync & Authentication (Optional)
- **Dual Storage Mode** - Choose between local-only (IndexedDB) or cloud sync (Supabase)
- **User Authentication** - Sign up, login, and password reset with Supabase Auth
- **Manual Data Transfer** - Upload local data to cloud or download cloud data to local storage
- **Public Profiles** - Share your problem-solving progress with a public profile URL
- **Multi-device Access** - Access your data from any device when using cloud mode

### Public Profile System
- **Custom Username** - Set a unique username for your public profile
- **Privacy Control** - Toggle between public and private profile visibility
- **Read-only Sharing** - Share your profile at `yoursite.com/{username}` for others to view
- **Profile Customization** - Set display name and manage public visibility
- **Individual Solution Sharing** - Share specific solutions with unique public links
- **Solution URL Routing** - Direct links to solutions with clean URLs (`/:username/solutions/:solutionId`)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: TanStack Router v1 (File-based routing with route generation)
- **Styling**: TailwindCSS 4 + shadcn/ui components
- **State Management**: React Context API + TanStack Query (Server state)
- **Data Fetching**: TanStack Query v5 (Caching, mutations, background sync)
- **Data Table**: TanStack Table v8
- **Local Storage**: Dexie.js (IndexedDB)
- **Backend** (Optional): Supabase (PostgreSQL + Auth + RLS)
- **Math Rendering**: KaTeX
- **Markdown**: react-markdown with syntax highlighting
- **Charts**: Recharts for interactive data visualization
- **Icons**: Lucide React & HugeIcons
- **Date Handling**: date-fns & react-day-picker
- **Deployment**: Netlify (with serverless functions for Luogu proxy)
- **CSV Processing**: Papa Parse
- **URL Search Params**: nuqs for type-safe URL state

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- (Optional) Supabase account for cloud sync features

### Installation

```bash
# Clone the repository
git clone https://github.com/lihaoze123/cptracker.git
cd cptracker

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup

#### Local-only Mode (Default)
No additional setup required. All data is stored in your browser's IndexedDB.

#### Cloud Sync Mode (Optional)

1. Create a Supabase project at https://supabase.com

2. Create `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the database schema in your Supabase SQL Editor:
```bash
# Copy the contents of supabase/schema.sql and run it in Supabase SQL Editor
```

This will create:
- `profiles` table for user information and public profile settings
- `problems` table for storing problem records
- Row Level Security (RLS) policies for secure data access
- Triggers for automatic profile creation and timestamp updates

4. Enable Email authentication in Supabase Dashboard:
   - Go to Authentication → Providers
   - Enable Email provider
   - Configure email templates (optional)

## Usage

### Storage Modes

**Local Mode** (Default)
- Data stored in browser IndexedDB
- No account required
- Data persists in the current browser only

**Cloud Mode**
- Requires Supabase setup and user account
- Data stored in Supabase PostgreSQL
- Access from any device
- Manual upload/download operations available

### OJ Import Feature

Import your solved problems directly from popular online judges:

1. **Codeforces**: Import using your handle
2. **AtCoder**: Import using your username
3. **Luogu (洛谷)**: Import using UID and Client ID (requires API credentials)

Features:
- Automatic difficulty conversion between different rating systems
- Bulk import with optional data merging
- Configurable import options (clear existing data or merge)
- Proxy support for CORS-restricted platforms (Luogu uses Netlify functions)

### Switching Between Modes

1. Open **Settings** panel
2. Select **Storage Mode**: Local or Cloud Sync
3. For Cloud mode, sign in with your account

### Data Transfer

**Upload Local to Cloud**
- Merges your local problems with existing cloud data
- Preserves both local and cloud records

**Download Cloud to Local**
- Replaces local data with cloud data
- Make sure to sync local changes before downloading

### Public Profile

1. Sign in to your account
2. Open **Settings** → **Public Profile**
3. Set your username (letters, numbers, underscores, hyphens only)
4. Enable **Public Profile** toggle
5. Copy and share your profile URL: `yoursite.com/{username}`

Others can visit your public profile to see:
- Your problem-solving heatmaps
- Your full problem history (read-only)
- Your profile display name

## Data Management

The application uses **TanStack Query** for efficient data fetching and caching:

### Benefits
- **Automatic Caching** - Reduces unnecessary database/network requests
- **Background Refetching** - Keeps your data fresh without manual refreshes
- **Optimistic Updates** - UI updates instantly while saving in the background
- **Request Deduplication** - Multiple components can share the same data efficiently
- **Built-in Loading & Error States** - Simplified state management

### How It Works
- **Local Mode**: Queries fetch from IndexedDB, mutations update local storage
- **Cloud Mode**: Queries fetch from Supabase, mutations sync to cloud database
- All data operations (add, edit, delete) automatically invalidate and refetch the cache
- The `useProblems()` hook provides a unified interface for both storage modes

## Routing

The application uses TanStack Router with file-based routing:

- `/` - Dashboard (main page with problem tracker)
- `/auth?view=login` - Login page
- `/auth?view=sign-up` - Sign up page
- `/auth?view=forgot-password` - Password reset page
- `/auth?view=update-password` - Update password page
- `/:username` - Public profile page (e.g., `/john_doe`)
- `/:username/solutions/:solutionId` - Shared solution page (redirects to profile with solution modal)

Routes are automatically generated from the `src/routes/` directory. The router includes:
- Type-safe navigation
- Search parameter validation with Zod
- Development tools (TanStack Router DevTools)
- Route-based solution sharing with redirect handling

## Data Schema

### Problems Table

| Field | Type | Description |
|-------|------|-------------|
| id | number/UUID | Unique identifier |
| 题目 | string | Problem URL or text |
| 难度 | string | Difficulty rating with fine granularity (supports Codeforces, AtCoder, Luogu ratings) |
| 题解 | string | Solution notes (supports Markdown/LaTeX) |
| 关键词 | string | Comma-separated tags (e.g., "dp, greedy, favorited") |
| 日期 | string | ISO datetime when problem was solved |

### Difficulty Rating System

The application supports multiple difficulty rating systems with automatic conversion:

- **Codeforces**: 800-3500+ rating scale
- **AtCoder**: 0-4000+ rating scale (converted to Codeforces equivalent)
- **Luogu (洛谷)**: 8-10 difficulty levels (converted to Codeforces equivalent)
- **Custom**: Any numeric difficulty value

Rating colors follow Codeforces conventions:
- Gray: < 1200
- Green: 1200-1399
- Cyan: 1400-1599
- Blue: 1600-1899
- Purple: 1900-2099
- Orange: 2100-2399
- Red: 2400-2599
- Dark Red: 2600+

### Profiles Table

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | User ID (references auth.users) |
| username | string | Unique username for public profile URL |
| display_name | string | Display name shown on profile |
| is_public | boolean | Whether profile is publicly accessible |
| created_at | timestamp | Profile creation time |
| updated_at | timestamp | Last update time |

## Project Structure

```
cptracker/
├── src/
│   ├── routes/             # TanStack Router routes
│   │   ├── __root.tsx     # Root layout with providers
│   │   ├── index.tsx      # Dashboard page (/)
│   │   ├── auth.tsx       # Authentication page (/auth)
│   │   ├── $username.tsx  # Public profile page (/:username)
│   │   └── $username/     # Nested routes
│   │       └── solutions/
│   │           └── $solutionId.tsx  # Solution sharing route
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── auth-page.tsx  # Authentication UI
│   │   ├── problems-table.tsx
│   │   ├── public-profile-view.tsx
│   │   ├── settings-sheet.tsx
│   │   ├── oj-import.tsx  # OJ import functionality
│   │   ├── problem-heatmaps.tsx  # Activity heatmaps
│   │   ├── rating-badge.tsx     # Difficulty rating display
│   │   ├── solution-dialog.tsx  # Solution view/share dialog
│   │   └── tags-input.tsx      # Tag input component
│   ├── contexts/          # React contexts
│   │   └── auth-context.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── use-problems-queries.ts  # TanStack Query hooks
│   │   └── use-toast.ts
│   ├── lib/               # Utility libraries
│   │   ├── db.ts         # IndexedDB (Dexie)
│   │   ├── storage-mode.ts
│   │   ├── fetchOJs.ts   # OJ platform integration
│   │   ├── csv.ts        # CSV import/export
│   │   ├── problem-utils.ts  # Problem utilities
│   │   └── supabase/     # Supabase integration
│   │       ├── client.ts
│   │       ├── auth.ts
│   │       ├── database.ts
│   │       └── profiles.ts
│   ├── data/              # Type definitions and mock data
│   │   └── mock.ts
│   └── main.tsx          # App entry point with QueryClientProvider + Router
├── supabase/
│   └── schema.sql        # Database schema for Supabase
├── netlify/              # Netlify configuration
│   └── functions/
│       └── luogu-proxy.ts  # Proxy for Luogu API
├── netlify.toml          # Netlify deployment config
├── CLAUDE.md             # Development guide for Claude Code
└── package.json
```

## Development

```bash
# Run development server
npm run dev

# Generate router routes (required after route changes)
npm run generate

# Type checking (without emitting files)
tsc -b

# Lint
npm run lint

# Build for production (includes route generation)
npm run build

# Preview production build
npm run preview
```

### Important Development Notes

1. **Route Generation**: Always run `npm run generate` after modifying any route files in `src/routes/`. The route tree (`src/routeTree.gen.ts`) is auto-generated and should never be edited manually.

2. **Build Process**: The build command automatically:
   - Generates the route tree
   - Runs TypeScript type checking
   - Creates the production bundle

3. **Storage Mode**: The app uses a dual storage system. Always use the `useProblems()` hook - never import `db.ts` or `supabase/database.ts` directly in components.

### Development Workflow

1. After modifying any route files in `src/routes/`, always run `npm run generate` to update the route tree
2. The project uses TypeScript strict mode - ensure all types are properly defined
3. The build process automatically generates routes, type-checks, and creates the production bundle

### Project Structure & Important Patterns

#### Storage Mode Abstraction
The application uses a dual storage system with a unified interface:

```typescript
// Always use this hook - never import db.ts or supabase/database.ts directly
import { useProblems } from "@/hooks/use-problems-queries";

// The hook automatically handles storage mode switching
const { data: problems, addProblem, updateProblem } = useProblems();
```

#### Route Management
- Routes are defined in `src/routes/` using file-based routing
- The route tree (`src/routeTree.gen.ts`) is auto-generated - never edit manually
- All routes inherit from the root layout (`__root.tsx`) which provides:
  - AuthContext for authentication state
  - NuqsAdapter for URL search params
  - TanStack Query client
  - Toast notifications

#### Component Architecture
- UI components use shadcn/ui patterns with class-variance-authority
- All components are mobile-first with Tailwind responsive breakpoints
- State management follows React patterns with proper memoization where needed

## Deployment

### Netlify Deployment

The project includes Netlify configuration for easy deployment:

1. **Automatic Deployment**: Connect your repository to Netlify for automatic deployments on push to main branch
2. **Serverless Functions**: The project uses Netlify Functions for the Luogu API proxy to handle CORS issues
3. **Environment Variables**: Set the following in Netlify dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Local Deployment

For local deployment without Netlify:

```bash
# Build for production
npm run build

# Serve the dist folder with any static server
npm install -g serve
serve -s dist
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Always use the `useProblems()` hook for data operations
- Run `npm run generate` after modifying routes
- Ensure TypeScript passes without errors
- Test both local and cloud storage modes when applicable

## License

AGPL-3.0 - see LICENSE file for details

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [TanStack Query](https://tanstack.com/query) for powerful data fetching and caching
- [TanStack Table](https://tanstack.com/table) for the powerful data table
- [TanStack Router](https://tanstack.com/router) for type-safe routing
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Dexie.js](https://dexie.org/) for IndexedDB wrapper
