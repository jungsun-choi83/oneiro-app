# ONEIRO — AI Dream Interpreter & Soul Guide

A Telegram Mini App that interprets dreams using AI, combining Freudian/Jungian psychology, Oriental Oneiromancy, and Western symbolism.

## Features

- 🌙 **Dream Interpretation**: AI-powered dream analysis with spiritual insights
- 🎨 **Dream Visualization**: Transform dreams into beautiful AI-generated art
- 📜 **Soul Reports**: Detailed 7-day spiritual guidance
- 📖 **Dream Journal**: Keep track of your dreams and interpretations
- 🌍 **Multi-language**: Supports English, Korean, Japanese, Spanish, and Arabic

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **i18n**: i18next
- **Backend**: Supabase (Edge Functions + PostgreSQL)
- **AI**: OpenAI GPT-4o-mini + DALL-E 3
- **Telegram**: Telegram Mini App SDK

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL, API keys, and Telegram bot token.

4. Set up Supabase:
   - Create a new Supabase project
   - Run the migration: `supabase/migrations/001_initial_schema.sql`
   - Deploy Edge Functions:
     ```bash
     supabase functions deploy interpret-dream
     supabase functions deploy visualize-dream
     supabase functions deploy daily-symbol
     supabase functions deploy create-invoice
     ```

5. Configure Telegram Bot:
   - Create a bot via @BotFather
   - Set up webhook (if needed)
   - Configure Mini App URL

6. Run development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── src/
│   ├── pages/          # Page components
│   ├── store/          # Zustand store
│   ├── i18n/           # Translation files
│   ├── lib/            # Utilities (Supabase, Telegram)
│   └── App.tsx         # Main app component
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## Routes

- `/` - Home dashboard
- `/dream` - Dream input
- `/loading` - Loading animation
- `/result` - Dream interpretation result
- `/visualize` - Dream visualization
- `/journal` - Dream journal

## Monetization

- **Full Reading**: 50 Stars (unlock complete interpretation)
- **Dream Visualizer**: 150 Stars (AI-generated art)
- **Soul Report**: 300 Stars (7-day guidance)

## License

MIT
