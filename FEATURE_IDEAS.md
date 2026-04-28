# Convoy — Feature Ideas

Researched from Wanderlog, TripIt, Flighty, Google Trips, Sygic Travel, TripCase, and common travel app complaints.

---

## HIGH IMPACT — Should build next

### 1. Budget Tracker
**The #1 complaint across travel apps.** No app does this well.
- Set a trip budget, track spending per day/category
- Split costs between trip members (who paid for dinner, who owes whom)
- Currency conversion built in (auto-detect based on destination)
- Visual breakdown: pie charts by category, daily burn rate
- "You're on track" / "You're over budget" indicators

### 2. Shared Packing Lists
- Pre-built templates by trip type (beach, ski, city, backpacking)
- Per-person assignment (Patrick needs to pack X, Jamie needs Y)
- Check-off items as you pack
- Smart suggestions based on weather + destination

### 3. Document Vault
- Upload/photo passports, visas, travel insurance, vaccination cards
- Booking confirmations (auto-extracted from email or manual upload)
- Available offline — critical when you're at immigration with no signal
- Shareable with trip members (so everyone has the group's docs)

### 4. Trip Comments & Discussion
- Comment threads on any itinerary item
- @mention trip members
- "Should we do this?" polls/votes on activities
- Notification when someone adds/changes something

### 5. Activity & Restaurant Discovery
- "Things to do in Dubrovnik" — powered by Foursquare/Google Places
- Show ratings, hours, distance from your lodging
- One-click add to your itinerary
- Filter by: type, rating, price, open now

---

## MEDIUM IMPACT — Great differentiators

### 6. Trip Timeline View
- Visual timeline showing the full trip at a glance
- Flights as connections, hotels as spans, activities as dots
- See gaps in your schedule
- Drag items to rearrange

### 7. Map View
- All itinerary items plotted on a map per day
- Walking/driving routes between items
- See your lodging relative to activities
- Discover nearby attractions you haven't added

### 8. Offline Mode
- Cache the full itinerary locally
- Works without internet (airport, plane, abroad without data)
- Sync changes when back online
- Critical for actual travel use

### 9. Trip Templates
- Browse public trips from other Convoy users
- "Clone this trip" — copy the full itinerary as a starting point
- Curated templates: "7 days in Italy", "Weekend in Paris"
- Friends' past trips as inspiration

### 10. Real-time Collaboration
- See who's viewing/editing the trip right now
- Live cursor/presence indicators
- Change history — who added/modified what and when
- Conflict resolution for simultaneous edits

### 11. Notifications System
- Push/email when: trip member adds an item, flight status changes, friend request
- Daily digest: "Tomorrow's itinerary" summary
- Pre-trip reminders: "Your trip starts in 3 days"

---

## NICE TO HAVE — Polish & delight

### 12. Trip Recap / Memory Book
- After the trip: auto-generate a summary
- Upload photos, tag them to itinerary days
- Shareable trip report (public link)
- "On this day last year" nostalgia feature

### 13. Expense Splitting (Splitwise-style)
- Track who paid for what
- Auto-calculate who owes whom
- Settle up at the end of the trip
- Integrates with the budget tracker

### 14. Travel Checklist Reminders
- "Have you checked visa requirements?"
- "Travel insurance for Croatia?"
- Country-specific advisories
- Vaccination requirements by destination

### 15. Multi-language Support
- Translate itinerary items
- Common phrases for the destination country
- Currency names and tipping customs

### 16. Calendar Sync
- Export trip to Google Calendar / Apple Calendar
- Each itinerary item becomes a calendar event
- Auto-update when items change

### 17. Email Import
- Forward booking confirmation emails
- Auto-parse flight, hotel, restaurant reservations
- Similar to TripIt's email forwarding

### 18. Transportation Integration
- Uber/Lyft deep links with pre-filled destination
- Public transit directions between items
- Car rental tracking

### 19. Loyalty Program Tracking
- Airline miles, hotel points
- "You'll earn X points on this trip"
- Status tier tracking

### 20. AI Trip Planner
- "Plan me a 5-day trip to Portugal"
- Generates a full itinerary draft
- Based on preferences, budget, travel style
- Uses Claude API

---

## What users hate about existing apps

1. **TripIt** — ugly UI, premium paywall for basic features, unreliable email parsing
2. **Google Trips** — was killed by Google (people are still mad)
3. **Wanderlog** — great but slow, cluttered UI, overwhelming options
4. **Sygic Travel** — feels outdated, poor collaboration
5. **Flighty** — amazing for flights but zero trip planning
6. **Notion/Sheets** — people use these because nothing else works, but hate maintaining them manually

**The gap Convoy fills**: Beautiful design (not corporate/ugly like TripIt), collaborative (not single-player like Flighty), all-in-one (not just flights or just hotels), and actually enjoyable to use.

---

## Recommended build order

1. Budget tracker (biggest pain point)
2. Packing lists (quick win, high engagement)
3. Activity discovery (leverages existing Foursquare integration)
4. Comments/discussion on items
5. Document vault
6. Calendar sync
7. Map view
8. Trip templates from friends
9. Offline mode
10. AI trip planner
