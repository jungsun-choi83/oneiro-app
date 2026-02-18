# Deployment Guide

## Prerequisites

1. Supabase account and project
2. Telegram Bot Token (from @BotFather)
3. OpenAI API key
4. Vercel account (for frontend deployment)

## Step 1: Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor and run `supabase/migrations/001_initial_schema.sql`
3. Go to Storage and create a bucket named `dream-images` (public)
4. Set up storage policies for public read access

## Step 2: Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy interpret-dream
supabase functions deploy visualize-dream
supabase functions deploy daily-symbol
supabase functions deploy create-invoice
```

Set environment variables in Supabase Dashboard:
- `OPENAI_API_KEY`: Your OpenAI API key
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Step 3: Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

4. Deploy

## Step 4: Telegram Bot Setup

1. Create bot via @BotFather
2. Set Mini App URL:
   ```
   /setmenubutton
   ```
   Choose your bot, then set URL to your Vercel deployment URL

3. Set up webhook (optional, for payment callbacks):
   ```
   /setwebhook
   ```
   URL: `https://your-bot-server.com/webhook`

## Step 5: Bot Server (Optional)

If you want to run the bot server separately:

```bash
cd bot
npm install
```

Set environment variables:
- `TELEGRAM_BOT_TOKEN`: Your bot token
- `MINI_APP_URL`: Your Vercel deployment URL

Run:
```bash
npm start
```

## Testing

1. Open your bot in Telegram
2. Click "Start" or use `/start` command
3. Click the Mini App button
4. Test dream interpretation flow

## Production Checklist

- [ ] Supabase database migrated
- [ ] Edge Functions deployed
- [ ] Environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Telegram bot configured
- [ ] Mini App URL set
- [ ] Storage bucket created and configured
- [ ] Payment webhook configured (if using)
