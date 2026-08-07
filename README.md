# BytesFlix

A premium Netflix-inspired streaming platform for streaming your own original, copyrighted video content. Built with React, Vite, Tailwind CSS, Framer Motion, and Supabase.

## Features

- **Cinematic Home Page** — Autoplay hero banner, horizontal scrolling content rows by genre, trending, recently added, and continue watching.
- **Custom Video Player** — Fullscreen, picture-in-picture, volume control, playback speed, quality selector, skip intro, resume from last position, auto-next episode, and subtitle support.
- **Dynamic Content** — Every movie and episode comes from the Supabase database. No hardcoded videos. New uploads appear instantly on the homepage, movie page, and watch page.
- **Admin Dashboard** — Upload videos, posters, banners, and trailers directly to Supabase Storage. Edit, delete, hide, publish, or draft videos. Manage users and site settings.
- **User Accounts** — Email/password authentication, user profiles with avatars, watch history, continue watching, and My List favorites.
- **Search** — Instant search by title, genre, language, and tags.
- **Responsive Design** — Optimized for desktop, tablet, and mobile.
- **Dark Mode** — Premium dark UI with red accent.

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- React Router (code-split routes)
- Framer Motion (animations)
- Supabase (database, auth, storage)
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. The Supabase environment variables are pre-configured in `.env`:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Database Schema

The database is automatically set up with the following tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (display name, avatar, admin flag) |
| `videos` | All streamable content (movies and episodes) |
| `series` | Series grouping for multi-episode content |
| `episodes` | Episode metadata linking videos to series/seasons |
| `categories` | Genre/category lookup |
| `watch_history` | Per-user watch records |
| `continue_watching` | Per-user resume positions |
| `favorites` | Per-user My List entries |
| `settings` | Site configuration (name, logo, theme, maintenance mode) |

## Storage Buckets

| Bucket | Contents |
|--------|----------|
| `videos` | Main video files (MP4) |
| `posters` | Portrait poster artwork |
| `banners` | Wide hero/banner artwork |
| `trailers` | Trailer video files |
| `avatars` | User profile avatars |
| `subtitles` | Subtitle files (VTT/SRT) |

## Admin Access

1. Register an account through the sign-up page.
2. In the Supabase dashboard, go to the `profiles` table and set `is_admin = true` for your user.
3. Navigate to `/admin` to access the Admin Dashboard.

## Deployment to Netlify

1. Push your code to a Git repository.
2. Connect the repository to Netlify.
3. Netlify will automatically detect the build settings from `netlify.toml`.
4. Add the environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in Netlify's environment settings.
5. Deploy.

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── admin/         # Admin dashboard sub-components
│   ├── VideoCard.tsx
│   ├── VideoRow.tsx
│   ├── VideoPlayer.tsx
│   ├── HeroBanner.tsx
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ...
├── context/           # React context providers (Auth, Settings)
├── lib/               # Supabase client, data access, utilities
├── pages/             # Route pages (Home, Watch, Admin, etc.)
├── types/             # TypeScript type definitions
├── App.tsx            # Router + providers
└── main.tsx           # Entry point
```

## License

This project is for streaming original, owned content only. All rights reserved.
