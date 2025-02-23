# EJ Fox Nuxt 3 Starter

[![Netlify Status](https://api.netlify.com/api/v1/badges/981b9e46-6878-4ddb-a716-2713c5f3e412/deploy-status)](https://app.netlify.com/sites/ejfox-nuxt-template/deploys)

## Usage
`npx room302-template`

Deployed through a small script that handles naming, cloning, and setting up the repo for prototyping. <https://www.npmjs.com/package/room302-template>

## What's different from the standard Nuxt 3 starter?
- VueUse 🔧 
- Vueuse motion 🌈 
- OpenAI plugin 🧠 
- Pinia store 🏬 
- Helpers file 🔨 
- Google fonts 🖋️ 

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

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
