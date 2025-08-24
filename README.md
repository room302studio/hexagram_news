# Hexagram News

A modern news aggregation platform built with Nuxt 3, featuring both traditional newspaper-style layout and a data-dense terminal aesthetic view.

## Features

- 📰 **Dual View Modes**: Traditional newspaper layout and data-dense terminal view
- 🏷️ **Tag-based Filtering**: Click any tag to filter articles
- 🔄 **Real-time Updates**: Automatic content refresh from Supabase
- 📱 **Responsive Design**: Optimized for all screen sizes
- 🎨 **Typography**: Custom fonts (Karla, Newsreader) for optimal reading
- ⚡ **Performance**: SSR with Nuxt 3 for fast initial loads

## Data Flow Architecture

### Overview

The application follows a clear data flow pattern from database to UI:

```
Supabase Database → Composables → Components → User Interface
```

### 1. Database Layer (Supabase)

The application uses two main tables:

- **`hexagramnews`**: Main articles table
  - Contains: id, title, url, source, timestamp, summary, tags (array)
  - Indexed on timestamp for performance
  
- **`scraps`**: Enhanced content from various sources
  - Contains: id, title, content, url, source, type, tags, metadata
  - Supports filtering by type, source, shared status
  - Includes media URLs and processing state

### 2. Data Fetching Layer (Composables)

#### `useHeadlines.ts`
- Fetches news articles from the `hexagramnews` table
- Provides real-time updates using Supabase subscriptions
- Returns reactive data that auto-updates when new articles arrive
- Handles error states and loading indicators

#### `useScraps.ts`
- Enhanced composable for the `scraps` table
- Features:
  - Advanced filtering (type, source, shared status)
  - Sorting options (newest, oldest, updated)
  - Pagination with infinite scroll support
  - Helper functions for media URLs and display formatting

### 3. Component Layer

#### Main News View (`pages/index.vue`)
- Uses `useHeadlines()` to fetch articles
- Groups articles by source into columns
- Displays using `NewsColumn` and `HeadlineLink` components
- Real-time updates without page refresh

#### Dense View (`pages/dense.vue`)
- Uses `useScraps()` for enhanced content
- Groups content by time periods
- Infinite scroll for loading more content
- Terminal-style display with metadata indicators

#### Tag Filtering (`pages/tag/[tag].vue`)
- Dynamic route for tag-based filtering
- Fetches all scraps with specific tag
- Maintains the same dense view aesthetic

### 4. Component Communication

```
index.vue
  ├── NewsColumn.vue
  │     └── HeadlineLink.vue
  │           └── MetaData.vue
  └── (real-time updates via useHeadlines)

dense.vue
  ├── DataDense.vue (repeated for each scrap)
  └── (infinite scroll via useScraps)
```

### 5. Real-time Updates

The application uses Supabase's real-time capabilities:

1. **Initial Load**: Composables fetch data on component mount
2. **Subscriptions**: Set up listeners for database changes
3. **Auto-refresh**: UI updates automatically when new content arrives
4. **Error Handling**: Graceful fallbacks for connection issues

### 6. State Management

- **Local State**: Each composable manages its own state
- **Reactive Data**: Vue 3's reactivity system ensures UI updates
- **No Global Store**: Simplified architecture without Pinia/Vuex

### 7. Performance Optimizations

- **SSR**: Server-side rendering for fast initial loads
- **Lazy Loading**: Infinite scroll prevents loading all data at once
- **Indexed Queries**: Database indexes on timestamp and tags
- **Computed Properties**: Efficient data transformations

## Environment Variables

Required for production:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

## Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# yarn
yarn dev
```

## Production

Build the application for production:

```bash
# yarn
yarn build
```

Locally preview production build:

```bash
# yarn
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Database Schema

The application uses Supabase as its backend. Here's the database schema:

### Hexagram News Table

```sql
create table hexagramnews (
  id bigint primary key generated always as identity,
  title text not null,
  url text not null unique,
  source text not null,
  timestamp timestamptz not null default now(),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table hexagramnews enable row level security;

-- Create a policy that allows anyone to read articles
create policy "Anyone can read news"
  on hexagramnews for select
  using (true);

-- Create a policy that only allows authenticated users to insert/update
create policy "Authenticated users can insert news"
  on hexagramnews for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update news"
  on hexagramnews for update
  using (auth.role() = 'authenticated');
```

### Article Tags Table

```sql
create table tags (
  id bigint primary key generated always as identity,
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table tags enable row level security;

-- Allow anyone to read tags
create policy "Anyone can read tags"
  on tags for select
  using (true);
```

### Article Tags Junction Table

```sql
create table news_tags (
  news_id bigint references hexagramnews(id) on delete cascade,
  tag_id bigint references tags(id) on delete cascade,
  primary key (news_id, tag_id),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table news_tags enable row level security;

-- Allow anyone to read article tags
create policy "Anyone can read news tags"
  on news_tags for select
  using (true);
```

### Email Subscriptions Table

```sql
create table subscriptions (
  id bigint primary key generated always as identity,
  email text not null unique,
  verified boolean not null default false,
  verification_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table subscriptions enable row level security;

-- Only allow insert for public
create policy "Anyone can subscribe"
  on subscriptions for insert
  with check (true);

-- Only authenticated users can read subscriptions
create policy "Only authenticated users can read subscriptions"
  on subscriptions for select
  using (auth.role() = 'authenticated');
```

### Indexes

```sql
-- Add indexes for better query performance
create index hexagramnews_timestamp_idx on hexagramnews(timestamp desc);
create index tags_name_idx on tags(name);
create index subscriptions_email_idx on subscriptions(email);
create index subscriptions_verification_token_idx on subscriptions(verification_token);
```

This schema provides:

- Full news article management with title, URL, source, and timestamp
- Flexible tagging system
- Email subscription system with verification
- Row Level Security (RLS) for proper access control
- Appropriate indexes for performance
- Timestamps for tracking creation and updates
- Referential integrity with foreign key constraints

To set up the database:

1. Create a new Supabase project
2. Run these SQL commands in the Supabase SQL editor
3. Configure your environment variables with the Supabase URL and anon key

## Deployment

### Netlify (Recommended)

1. **Connect Repository**: Link your GitHub/GitLab repository to Netlify
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.output/public`
   - Functions directory: `.output/server`
3. **Environment Variables**: Add in Netlify dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
4. **Deploy**: Push to main branch or trigger manual deploy

### Vercel

1. Import project from Git
2. Framework preset: Nuxt.js
3. Add environment variables
4. Deploy

### Node.js Server

```bash
# Build
npm run build

# Preview locally
node .output/server/index.mjs

# Production with PM2
pm2 start .output/server/index.mjs --name "hexagram-news"
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run prettier` - Format code

## Tech Stack

- **Framework**: Nuxt 3
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Fonts**: Google Fonts (Karla, Newsreader)
- **Icons**: Heroicons
- **Date Handling**: date-fns
- **Markdown**: marked
- **Deployment**: Netlify/Vercel
