# CPTracker

A modern, full-stack dashboard for tracking competitive programming progress. Record solved problems, visualize your activity with heatmaps, organize solutions with Markdown and LaTeX support, and optionally sync your data to the cloud with multi-device access.

## Features

### Core Features
- **Problem Tracking** - Log problems with URL, difficulty rating, solution notes, and tags
- **Activity Heatmaps** - Visualize daily problem count and max difficulty over time
- **Advanced Data Table** - Filter by source/tags/difficulty/date, sort, and search through your problem history
- **Rich Text Solutions** - Write solutions with Markdown, LaTeX math, and syntax-highlighted code blocks
- **CSV Import/Export** - Backup and restore your data easily
- **OJ Import** - Import problems directly from Codeforces, AtCoder, and other OJ platforms

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

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: TanStack Router v1 (File-based routing)
- **Styling**: TailwindCSS 4 + shadcn/ui components
- **State Management**: React Context API + TanStack Query (Server state)
- **Data Fetching**: TanStack Query v5 (Caching, mutations, background sync)
- **Data Table**: TanStack Table v8
- **Local Storage**: Dexie.js (IndexedDB)
- **Backend** (Optional): Supabase (PostgreSQL + Auth + RLS)
- **Math Rendering**: KaTeX
- **Markdown**: react-markdown

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

Routes are automatically generated from the `src/routes/` directory. The router includes:
- Type-safe navigation
- Search parameter validation with Zod
- Development tools (TanStack Router DevTools)

## Data Schema

### Problems Table

| Field | Type | Description |
|-------|------|-------------|
| id | number/UUID | Unique identifier |
| 题目 | string | Problem URL or text |
| 难度 | string | Difficulty rating (e.g., 1000-3500 for Codeforces) |
| 题解 | string | Solution notes (supports Markdown/LaTeX) |
| 关键词 | string | Comma-separated tags (e.g., "dp, greedy, favorited") |
| 日期 | string | ISO datetime when problem was solved |

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
│   │   └── $username.tsx  # Public profile page (/:username)
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── auth-page.tsx  # Authentication UI
│   │   ├── problems-table.tsx
│   │   ├── public-profile-view.tsx
│   │   └── settings-sheet.tsx
│   ├── contexts/          # React contexts
│   │   └── auth-context.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── use-problems-queries.ts  # TanStack Query hooks
│   │   └── use-toast.ts
│   ├── lib/               # Utility libraries
│   │   ├── db.ts         # IndexedDB (Dexie)
│   │   ├── storage-mode.ts
│   │   └── supabase/     # Supabase integration
│   │       ├── client.ts
│   │       ├── auth.ts
│   │       ├── database.ts
│   │       └── profiles.ts
│   └── main.tsx          # App entry point with QueryClientProvider + Router
├── supabase/
│   └── schema.sql        # Database schema for Supabase
└── package.json
```

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run tsc

# Lint
npm run lint

# Build
npm run build

# Preview production build
npm run preview
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

AGPL-3.0 - see LICENSE file for details

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [TanStack Query](https://tanstack.com/query) for powerful data fetching and caching
- [TanStack Table](https://tanstack.com/table) for the powerful data table
- [TanStack Router](https://tanstack.com/router) for type-safe routing
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Dexie.js](https://dexie.org/) for IndexedDB wrapper
