# Convoy

A collaborative trip planning app built for groups who want to travel smarter. Plan itineraries, track flights, manage lodging, discover restaurants, and coordinate with your travel crew — all in one place.

## Features

### Trip Planning
- Multi-city itineraries with drag-to-reorder destinations
- Day-by-day schedule with type-segmented sections (flights, lodging, dining, transport, activities, notes)
- Per-day location setting with city autocomplete
- Weather forecasts and 5-year historical averages per day
- AI-generated daily summaries (powered by Claude)
- Editable day notes
- Timeline view with free-time gap indicators
- Custom date and time pickers

### Flights
- Auto-lookup by flight number via AeroDataBox
- Live status, terminal, gate, aircraft info
- Detail modal with scheduled/revised/actual times
- Distance, timezone, and codeshare information

### Lodging
- Airbnb link paste — auto-extracts property name, rating, location from listing metadata
- Hotel search via Foursquare Places API
- Check-in/check-out spanning multiple days
- Lodging appears as context in day headers, not as schedule items

### Dining
- Restaurant search by city via Foursquare
- Auto-detected meal tags (Breakfast/Lunch/Dinner)
- Restaurant detail modal with address, phone, website, social links, Google Maps link
- Cuisine category tags

### Transport
- 11 transport sub-types (Ferry, Train, Rideshare, Bus, etc.) with custom SVG icons
- File attachment uploads for tickets and documents (Supabase Storage)
- Location autocomplete

### Social
- Friends system (send/accept/decline requests)
- User profiles with username, bio, avatar with crop/resize
- Public profile pages with passport stamps
- Trip sharing: invite friends, share link, or invite by email
- Member roles (Owner/Editor/Viewer)

### Passport
- Vintage-themed country stamps auto-generated from completed trips
- 80+ countries with unique color palettes, native script labels, and iconic symbols
- Stamps only appear after trips are completed

### Design
- Cream/papyrus (#F5EFE0) + deep forest green (#1C3829) color palette
- Cormorant Garamond display headlines, DM Sans body, Playfair Display accents
- Custom SVG icons throughout (no emojis)
- Responsive design, frosted glass navigation
- Cinematic landing page with split hero, photo grid, film strip, destination ticker

## Tech Stack

- **Frontend**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Deployment**: Vercel

### API Integrations
- **Supabase Auth** — Email/password + Google OAuth
- **AeroDataBox** (via RapidAPI) — Flight tracking and status
- **Foursquare Places API** — Restaurant and hotel search
- **Unsplash API** — Trip cover photo search
- **Open-Meteo** — Weather forecasts and historical data
- **Photon** (OpenStreetMap) — City/location geocoding and autocomplete
- **Anthropic Claude** — AI day summaries

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- A Supabase project
- API keys (see below)

### Installation

```bash
git clone https://github.com/gilligan12/convoy.git
cd convoy
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:
- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anonymous key
- `VITE_UNSPLASH_ACCESS_KEY` — [Unsplash Developers](https://unsplash.com/developers)
- `VITE_RAPIDAPI_KEY` — [RapidAPI](https://rapidapi.com) (subscribe to AeroDataBox)
- `VITE_FOURSQUARE_KEY` — [Foursquare Developers](https://location.foursquare.com/developer)
- `VITE_ANTHROPIC_API_KEY` — [Anthropic Console](https://console.anthropic.com)

### Database Setup

Apply all migrations to your Supabase project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production Build

```bash
npm run build
```

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set Framework Preset to "Vite"
4. Add all environment variables from `.env.example`
5. Deploy

The `vercel.json` and `api/` serverless functions handle the Foursquare and Claude API proxies in production.

## Project Structure

```
src/
  components/     # Shared components (Logo, Avatar, AppNav)
  context/        # React context (AuthContext)
  data/           # Static data (country stamps)
  lib/            # Supabase client
  pages/          # Page components
    Landing.jsx   # Marketing homepage
    Login.jsx     # Login page
    SignUp.jsx    # Signup page
    Dashboard.jsx # Trip list + create
    Trip.jsx      # Trip detail + itinerary editor
    Friends.jsx   # Friends management
    Profile.jsx   # Profile settings
    UserProfile.jsx # Public user profile + passport
    JoinTrip.jsx  # Invite link handler
api/              # Vercel serverless functions
supabase/
  migrations/     # Database migrations
```

## Database Schema

- **profiles** — User data (name, username, avatar, email)
- **trips** — Trip metadata (name, destinations, dates, cover, day locations/summaries/notes)
- **trip_members** — Access control (owner/editor/viewer roles)
- **itinerary_items** — Day-by-day items (flights, hotels, restaurants, transport, activities, notes)
- **attachments** — File uploads for transport items
- **friendships** — Friend request system
- **invitations** — Email-based trip invitations
- **restaurant_ratings** — Personal restaurant ratings
- **rating_photos** — Photos attached to ratings

All tables use Row Level Security (RLS) — users can only access trips they're members of.

## License

Private project.
