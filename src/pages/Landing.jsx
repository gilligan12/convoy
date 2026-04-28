import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const UNS = 'https://images.unsplash.com/photo-'

/* ── Film strip photos ── */
const FILM = [
  { id: '1499856871958-5b9627545d1a', place: 'Paris, France' },
  { id: '1523906834658-6e24ef2386f9', place: 'Venice, Italy' },
  { id: '1516483638261-f4dbaf036963', place: 'Cinque Terre' },
  { id: '1533105079780-92b9be482077', place: 'Santorini, Greece' },
  { id: '1476514525535-07fb3b4ae5f1', place: 'Swiss Alps' },
  { id: '1493976040374-85c8e12f0c0e', place: 'Kyoto, Japan' },
  { id: '1540959733332-eab4deabeeaf', place: 'Tokyo, Japan' },
  { id: '1488646953014-85cb44e25828', place: 'Maldives' },
]
const FILM_DOUBLED = [...FILM, ...FILM]

/* ── Hero polaroid trips ── */
const TRIPS = [
  {
    name: 'Paris Getaway',
    destination: 'Paris, France',
    dates: 'Jun 12 – 19',
    members: ['P', 'A', 'S'],
    photo: '1499856871958-5b9627545d1a',
  },
  {
    name: 'Amalfi Summer',
    destination: 'Amalfi Coast, Italy',
    dates: 'Jul 4 – 11',
    members: ['J', 'M', 'R'],
    photo: '1516483638261-f4dbaf036963',
  },
  {
    name: 'Tokyo in Spring',
    destination: 'Tokyo, Japan',
    dates: 'Mar 28 – Apr 6',
    members: ['R', 'K', 'L', 'T'],
    photo: '1540959733332-eab4deabeeaf',
  },
]

/* ── Destination ticker ── */
const TICKER_BASE = [
  'Paris', 'Venice', 'Tokyo', 'Santorini', 'Kyoto', 'Amalfi Coast',
  'Swiss Alps', 'Maldives', 'New York', 'Barcelona', 'Capri', 'Lisbon',
  'Copenhagen', 'Marrakech', 'Bali', 'Dubrovnik', 'Reykjavík', 'Havana',
]
const TICKER = [...TICKER_BASE, ...TICKER_BASE]

/* ── Features ── */
const FEATURES = [
  { title: 'Day-by-day itinerary',  desc: 'Build a complete timeline — flights, hotels, restaurants, and activities, all in order.' },
  { title: 'Invite your crew',       desc: 'Share your trip with a link. Everyone sees the same plan, always up to date.' },
  { title: 'Roles & permissions',    desc: 'Owners, editors, and viewers — you decide exactly who can make changes.' },
  { title: 'Rich item details',      desc: 'Attach locations, notes, booking references, and time slots to any item.' },
  { title: 'iPhone-ready',           desc: 'Pull it up at the airport or the hotel. Looks great on every device.' },
  { title: 'Email invitations',      desc: 'Invite people without an account. They sign up and join your trip instantly.' },
]

const cg = { fontFamily: "'Cormorant Garamond', Georgia, serif" }

/* ── Polaroid card ── */
function PolaroidCard({ trip, floatClass, style }) {
  return (
    <div
      style={style}
      className={`${floatClass} absolute z-20 bg-white shadow-2xl shadow-black/35 p-3 pb-10`}
    >
      <div className="relative w-[175px] h-[145px] overflow-hidden grain vignette">
        <img
          src={`${UNS}${trip.photo}?auto=format&fit=crop&w=350&h=290&q=80`}
          alt={trip.destination}
          className="vintage w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="mt-3 px-1">
        <p
          className="text-[#1C3829] text-xs font-semibold leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {trip.name}
        </p>
        <p className="text-[#7A8F82] text-[10px] mt-0.5">{trip.destination}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex -space-x-1">
            {trip.members.slice(0, 3).map((m, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-[#1C3829]/12 border border-[#1C3829]/15 flex items-center justify-center text-[9px] text-[#1C3829] font-semibold"
              >
                {m}
              </div>
            ))}
          </div>
          <span className="text-[#7A8F82] text-[9px]">{trip.dates}</span>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F5EFE0] text-[#1a2b20] overflow-x-hidden selection:bg-[#1C3829]/20">

      {/* ──────────────────────────── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 bg-[#F5EFE0]/92 backdrop-blur-md border-b border-[#1C3829]/8">
        <Logo size="md" variant="dark" />
        <div className="flex items-center gap-1">
          <Link
            to="/login"
            className="text-sm text-[#1C3829]/50 hover:text-[#1C3829] transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="btn-primary text-sm font-medium px-5 py-2.5 rounded-full"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ──────────────────────────── Hero ── */}
      <section className="relative flex min-h-[calc(100vh-65px)] overflow-hidden">

        {/* Background photo — visible on ALL screens */}
        <div className="absolute inset-0">
          <img
            src={`${UNS}1533105079780-92b9be482077?auto=format&fit=crop&w=1600&h=1200&q=85`}
            alt="Santorini, Greece"
            className="vintage w-full h-full object-cover"
          />
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F5EFE0] via-[#F5EFE0]/95 to-[#F5EFE0]/40 lg:via-[#F5EFE0]/85 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F5EFE0]/60 to-transparent lg:hidden" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-20 lg:py-24 lg:max-w-[58%]">

          <p className="fade-up eyebrow mb-7">
            ✦ &nbsp; Trip planning, reimagined
          </p>

          <h1 className="fade-up-1 hero-headline mb-7">
            Plan trips.<br />
            <span className="hero-headline-italic">Travel together.</span>
          </h1>

          <p className="fade-up-2 text-base text-[#4A6356] leading-relaxed mb-10 max-w-[380px]">
            Convoy keeps your itinerary, your crew, and all your plans in one seamless place — from first idea to final day.
          </p>

          <div className="fade-up-3 flex flex-col sm:flex-row items-start gap-3">
            <Link
              to="/signup"
              className="btn-primary w-full sm:w-auto text-center px-8 py-3.5 rounded-full text-sm font-semibold"
            >
              Start planning free →
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto text-center border border-[#1C3829]/20 text-[#1C3829] px-8 py-3.5 rounded-full text-sm font-medium hover:bg-[#1C3829]/5 transition-colors"
            >
              Log in
            </Link>
          </div>

          <p className="fade-up-4 text-xs text-[#1C3829]/28 mt-5">
            Free to use · No credit card needed
          </p>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-6 sm:left-12 lg:left-16 hidden sm:flex flex-col items-start gap-2">
            <span className="eyebrow" style={{ fontSize: '9px' }}>Scroll to explore</span>
            <div className="scroll-line" />
          </div>
        </div>

        {/* Floating polaroid cards — desktop only */}
        <div className="hidden lg:block flex-shrink-0 w-[42%] relative z-10">
          <PolaroidCard trip={TRIPS[0]} floatClass="card-float-1" style={{ top: '10%',  left: 28 }} />
          <PolaroidCard trip={TRIPS[1]} floatClass="card-float-2" style={{ top: '42%',  right: 20 }} />
          <PolaroidCard trip={TRIPS[2]} floatClass="card-float-3" style={{ bottom: '8%', left: 20 }} />
        </div>
      </section>

      {/* ──────────────────────────── Destination ticker ── */}
      <div className="border-y border-[#1C3829]/8 py-4 overflow-hidden bg-[#F5EFE0]">
        <div className="ticker-track">
          {TICKER.map((city, i) => (
            <span key={i} className="whitespace-nowrap inline-flex items-center">
              <span className="eyebrow px-5">{city}</span>
              <span className="text-[#1C3829]/20 text-xs select-none">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ──────────────────────────── Editorial photo grid ── */}
      <section className="bg-[#F5EFE0] px-6 sm:px-10 py-12">
        <div className="max-w-6xl mx-auto">
          <div
            className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-2.5"
            style={{ height: 'clamp(280px, 38vw, 580px)' }}
          >
            {/* Large photo — Paris (spans both rows) */}
            <div className="row-span-2 photo-card grain vignette rounded-sm">
              <img
                src={`${UNS}1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&h=1200&q=85`}
                alt="Paris, France"
                className="vintage w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 z-20 p-5 bg-gradient-to-t from-black/60 to-transparent">
                <p className="eyebrow text-[#F5EFE0]/85">Paris, France</p>
              </div>
            </div>

            {/* Venice */}
            <div className="photo-card grain vignette rounded-sm">
              <img
                src={`${UNS}1523906834658-6e24ef2386f9?auto=format&fit=crop&w=700&h=500&q=85`}
                alt="Venice, Italy"
                className="vintage w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <p className="eyebrow text-[#F5EFE0]/85">Venice, Italy</p>
              </div>
            </div>

            {/* Kyoto */}
            <div className="photo-card grain vignette rounded-sm">
              <img
                src={`${UNS}1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=700&h=500&q=85`}
                alt="Kyoto, Japan"
                className="vintage w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <p className="eyebrow text-[#F5EFE0]/85">Kyoto, Japan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────── Film strip ── */}
      <section className="bg-[#1C3829] py-20 overflow-hidden mt-10">
        <div className="text-center mb-10 px-6">
          <p className="eyebrow text-[#F5EFE0]/30 mb-5">From the road</p>
          <h2
            className="text-4xl sm:text-5xl font-semibold text-[#F5EFE0] tracking-tight mb-3"
            style={{ ...cg, fontStyle: 'italic' }}
          >
            The world is waiting.
          </h2>
          <p className="text-[#F5EFE0]/30 text-sm max-w-xs mx-auto leading-relaxed">
            Every great trip starts with a plan. Convoy makes it beautiful.
          </p>
        </div>

        <div className="relative">
          <div className="film-perfs w-full mb-2" />

          <div className="overflow-hidden py-3 bg-black/20">
            <div className="film-roll gap-3 px-1.5">
              {FILM_DOUBLED.map((img, i) => (
                <div
                  key={i}
                  className="relative flex-shrink-0 w-[220px] h-[155px] rounded-sm overflow-hidden grain vignette cursor-pointer"
                >
                  <img
                    src={`${UNS}${img.id}?auto=format&fit=crop&w=440&h=310&q=75`}
                    alt={img.place}
                    className="vintage w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 inset-x-0 z-20 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-[#F5EFE0]/80 text-[10px] font-medium tracking-wide">
                      {img.place}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="film-perfs w-full mt-2" />

          <div className="absolute inset-y-0 left-0  w-20 bg-gradient-to-r from-[#1C3829] to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#1C3829] to-transparent pointer-events-none z-10" />
        </div>

        <p
          className="text-center text-[#F5EFE0]/18 text-xs mt-6 italic"
          style={cg}
        >
          Hover to pause · Shot on film
        </p>
      </section>

      {/* ──────────────────────────── Features ── */}
      <section className="bg-[#F5EFE0] px-6 sm:px-16 py-28">
        <div className="max-w-5xl mx-auto">

          <div className="mb-16 lg:flex lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow mb-4">Why Convoy</p>
              <h2
                className="text-4xl sm:text-5xl font-semibold text-[#1a2b20] tracking-tight leading-[1.06]"
                style={cg}
              >
                Everything in<br />one place.
              </h2>
            </div>
            <p className="text-[#4A6356] max-w-[210px] text-sm leading-relaxed mt-4 lg:mt-0 lg:text-right">
              Built for groups who want to travel smarter, not just plan more.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-row">
                <span className="feature-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="pt-1">
                  <h3
                    className="text-[#1a2b20] font-semibold text-sm mb-1.5"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-[#4A6356] text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────── CTA ── */}
      <section className="bg-[#1C3829] px-6 py-36 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="eyebrow text-[#F5EFE0]/30 mb-8">Ready to explore?</p>
          <h2
            className="text-5xl sm:text-6xl lg:text-[4.5rem] font-semibold text-[#F5EFE0] mb-12 leading-[1.04] tracking-tight"
            style={{ ...cg, fontStyle: 'italic' }}
          >
            Your next adventure<br />starts here.
          </h2>
          <Link
            to="/signup"
            className="inline-block bg-[#F5EFE0] text-[#1C3829] px-12 py-4 rounded-full text-sm font-semibold hover:bg-white hover:scale-105 transition-all shadow-xl shadow-black/25"
          >
            Get started — it's free
          </Link>
          <p className="text-[#F5EFE0]/20 text-xs mt-6">No credit card required</p>
        </div>
      </section>

      {/* ──────────────────────────── Footer ── */}
      <footer className="bg-[#152d20] px-6 py-8 text-center border-t border-white/5">
        <div className="flex justify-center mb-2" style={{ opacity: 0.28 }}>
          <Logo size="sm" variant="light" />
        </div>
        <p className="text-xs text-[#F5EFE0]/18">
          © {new Date().getFullYear()} Convoy. Made for travelers.
        </p>
      </footer>

    </div>
  )
}
