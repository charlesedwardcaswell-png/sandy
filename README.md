# LBS RPG Companion — Sandy

Web-based session management tool for Legend of the Burning Sands tabletop RPG.

**Stack:** React · Supabase · Netlify

---

## Local Development

```bash
npm install
npm start
```

Runs on http://localhost:3000

---

## Environment Variables

Create a `.env.local` file in the project root (this file is gitignored — never commit it):

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from your Supabase project dashboard under Settings → API.

---

## Netlify Deploy

1. Connect this GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `build`
4. Add environment variables in Netlify dashboard: Site Settings → Environment Variables
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

The `netlify.toml` in this repo handles routing automatically.

---

## Project Structure

```
src/
  lib/          — Supabase client, utilities
  components/   — React components (tabs, modals, etc.)
  hooks/        — Custom React hooks
  data/         — Static game data (schools, factions, spells, etc.)
public/
  assets/maps/  — Map images
```

---

## Design Documents

Full design specs live in the `/docs` folder and in the Claude project.
See `PROJECT_INSTRUCTIONS.md` for the full document index.
