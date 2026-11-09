# NestMate roommate matching

## Current state

The repository contains a NestJS backend written in JavaScript. It uses in-memory repositories for
users and profiles, so data is available while the backend is running. Replace those repositories
with a database implementation before production use.

## Development

Run backend commands from the project root (the directory containing the
backend `package.json`):

```bash
npm install
npm run build
npm test
```

Run mobile commands from the `mobile/` directory, which has its own
`package.json`:

```bash
cd mobile
npm install
npm test
```

Running `npm test` from the parent download directory will fail because that
directory does not contain a `package.json`.

The `rankMatches` function scores a user's candidates with the existing compatibility algorithm,
sorts them from highest to lowest, and returns each candidate ID, score, and score breakdown.

## Authentication and matching endpoints

Register and log in to receive a bearer token:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

Send the token on protected requests:

```text
Authorization: Bearer <access-token>
```

The matching routes require that the authenticated user owns the requested profile:

`GET /api/matches?profileId=<id>&page=1&limit=10` loads the user's profile with
`MatchingProfileRepository.findProfile`, loads candidates with
`MatchingProfileRepository.findCandidates`, and ranks them with `rankMatches`.
Results are ranked before pagination. `page` defaults to `1`, `limit` defaults to
`10`, and limits above `50` are capped at `50`.

`PUT /api/matches/<profileId>/preferences` saves or updates the authenticated user's preferences.
Passwords are stored as bcrypt hashes and access tokens expire after one hour. Logout revokes the
current token in the running process.

The response has this shape:

```json
{
  "profileId": "user-1",
  "page": 1,
  "limit": 10,
  "total": 1,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false,
  "matches": [
    {
      "candidateId": "candidate-1",
      "score": 83,
      "breakdown": {
        "budget": 0.8,
        "location": 1,
        "lifestyle": 0.5,
        "habitsAndPreferences": 1
      },
      "explanations": {
        "budget": {
          "status": "strong match",
          "text": "Budgets are closely aligned."
        },
        "location": {
          "status": "match",
          "text": "Preferred locations match."
        },
        "lifestyle": {
          "status": "partial match",
          "text": "1 of 2 available lifestyle preferences match. Some preferences differ."
        },
        "habitsAndPreferences": {
          "status": "strong match",
          "text": "2 of 2 available habits preferences match."
        },
        "overall": {
          "status": "strong match",
          "text": "83% overall compatibility across the available factors."
        }
      }
    }
  ]
}
```

Missing or invalid inputs return `400`, unknown profiles return `404`, unauthorized requests return
`401`, and attempts to access another user's profile return `403`.

## Mobile app

The Expo React Native app is in [`mobile/`](./mobile/). It provides registration and login screens,
stores the access token with `expo-secure-store`, and removes it on logout. The recommendations
and preference screens send the bearer token to the protected backend routes.

Profile photos are uploaded with:

```text
POST /api/auth/profile/photo
```

Send a multipart form field named `photo` with a JPEG, PNG, or WebP image no larger than 5 MB.
The backend stores the file in `uploads/profile-photos/` and stores only its path in the in-memory
user record. The `uploads/` directory is ignored by Git and files are served through `/uploads`.
The mobile profile screen requests gallery permission, previews the selected image, and uploads it
after the user confirms.

## Favorite roommates

Authenticated users can manage their own saved roommates:

```text
POST   /api/favorites/<roommateId>
DELETE /api/favorites/<roommateId>
GET    /api/favorites
```

Favorites are stored as user-to-roommate relationships in the in-memory favorites repository.
Duplicate saves are rejected, and the list includes the roommate profile plus the latest
compatibility score and breakdown. All three endpoints require a bearer token.

## Connection requests

Authenticated users can send and manage roommate connection requests:

```text
POST   /api/connection-requests/<receiverId>
GET    /api/connection-requests/received
GET    /api/connection-requests/sent
PATCH  /api/connection-requests/<requestId>/accept
PATCH  /api/connection-requests/<requestId>/reject
DELETE /api/connection-requests/<requestId>/cancel
```

Requests contain sender, receiver, status, and timestamps. Pending duplicates and self-requests
are rejected. Only the receiver can accept or reject a request, and only the sender can cancel it.
The mobile app provides separate received and sent sections.

## In-app notifications

Authenticated users can retrieve and update their own notifications:

```text
GET   /api/notifications
PATCH /api/notifications/<notificationId>/read
PATCH /api/notifications/read-all
```

Notifications are created for new connection requests and for accepted or rejected requests.
Each item contains a recipient, title, message, type, read status, timestamp, and related request
or user ID. Repeated processing of the same request event does not create duplicates. The mobile
app displays unread items with a badge and can open the related roommate profile when available.

## Roommate search

Authenticated users can search profiles with multiple filters:

```text
GET /api/search?minBudget=500&maxBudget=1500&preferredArea=Central&foodHabits=vegetarian&sleepSchedule=flexible&smoking=no&drinking=no&sort=compatibility
```

Supported sorting values are `compatibility`, `budget`, and `location`. Search excludes the
current user and returns only public profile fields, compatibility scores, and score breakdowns.
The mobile app provides filter controls, clear filters, empty/error states, and reuses the existing
favorite and connection-request actions.

## Accommodation listings

Authenticated users can browse and publish accommodation listings:

```text
POST   /api/accommodations
GET    /api/accommodations?preferredArea=Central&minRent=5000&maxRent=15000&type=flat
GET    /api/accommodations/<listingId>
PUT    /api/accommodations/<listingId>
DELETE /api/accommodations/<listingId>
```

Listings validate title, description, city, location, rent, rooms, date, and type. Supported types
are `flat`, `apartment`, `pg`, and `shared-room`. Only the owner can update or delete a listing.
The current mobile form accepts listing details and displays available listings with rent and
location filters. Listing photo URLs are supported as data fields; binary listing uploads are not
added because the existing photo endpoint is specifically for user profile photos.

Accommodation recommendations are available to authenticated users at:

```text
GET /api/accommodations/recommendations
```

Each listing receives a score from 0 to 100. Budget contributes 35 points, location 30 points,
accommodation type 15 points, available rooms 10 points, and move-in date 10 points. If a user
has not selected an accommodation type, that category receives a neutral score. Invalid or
unavailable listings are excluded, and results are returned highest score first.

## Accommodation booking requests

Authenticated users can request an accommodation:

```text
POST   /api/booking-requests/<listingId>
GET    /api/booking-requests/received
GET    /api/booking-requests/sent
PATCH  /api/booking-requests/<requestId>/accept
PATCH  /api/booking-requests/<requestId>/reject
DELETE /api/booking-requests/<requestId>/cancel
```

Booking requests include a requested move-in date, occupant count, optional message, listing ID,
sender, owner, status, and timestamps. Owners manage received requests; requesters manage sent
requests. New requests and status changes create in-app notifications.

## Reviews and ratings

Authenticated review endpoints are available for eligible interactions:

```text
POST   /api/reviews/roommates/<roommateId>
GET    /api/reviews/roommates/<roommateId>
POST   /api/reviews/accommodations/<listingId>
GET    /api/reviews/accommodations/<listingId>
PATCH  /api/reviews/<reviewId>
DELETE /api/reviews/<reviewId>
```

Roommate reviews require an accepted connection. Accommodation reviews require an accepted or
completed booking. Reviews contain a 1-to-5 rating and an optional comment; duplicate reviews for
the same interaction are rejected. Responses include the average rating and total review count.
Review data uses the existing in-memory storage approach and resets when the backend restarts.

## User dashboard

The authenticated dashboard endpoint combines the current user's existing profile, matching,
favorites, connection requests, booking requests, notifications, and conversations:

```text
GET /api/dashboard
```

The response contains profile completion, private activity counts, recent messages, and recent
notification activity. The mobile home screen refreshes this summary whenever the user returns to
it, and users can also refresh it manually. No data from another user's account is included.

Profile completion uses supported fields only: full name, profile photo, budget range, preferred
location, sleeping habits, food habits, cleanliness, smoking preference, and drinking preference.
The response includes both a percentage and a list of missing field labels. Unsupported optional
fields such as age or occupation are not counted.

## Notification preferences

Authenticated users can manage their notification choices:

```text
GET   /api/notifications/preferences
PATCH /api/notifications/preferences
```

Preferences are stored per user in the backend. Defaults are enabled for connection requests,
connection updates, messages, match recommendations, booking updates, and review updates. The
notification service checks these settings before creating a notification, while the existing
notification list and read APIs remain unchanged.

## Account privacy

Authenticated users can manage their visibility settings:

```text
GET   /api/privacy/preferences
PATCH /api/privacy/preferences
```

Settings default to enabled for existing users and are stored separately in the
privacy repository. Hidden profiles are excluded from search and matching
recommendations, while budget and lifestyle fields are removed from public
profile responses when those options are disabled. Connection requests are
rejected when the recipient has disabled them.

## Blocking and reporting

Authenticated users can manage their own blocked-user list:

```text
GET    /api/blocks
POST   /api/blocks/:userId
DELETE /api/blocks/:userId
POST   /api/reports/:userId
```

Reports accept one of the supported categories (`fake-profile`, `spam`,
`inappropriate-behaviour`, `harassment-or-threats`, `suspicious-activity`, or
`other`) and an optional description. A matching report from the same reporter
for the same user and category is limited to once per 24 hours. Blocking is
enforced by search, matching, favorites, connection requests, and chat APIs.

## Private roommate chat

Users can chat after an accepted roommate connection or while they have a pending or accepted
booking request involving the other user:

```text
POST  /api/chat/conversations/<otherUserId>
GET   /api/chat/conversations
GET   /api/chat/conversations/<conversationId>/messages
POST  /api/chat/conversations/<conversationId>/messages
PATCH /api/chat/conversations/<conversationId>/read
```

Messages are stored in memory with sender, receiver, conversation, content, read status, and
timestamps. The mobile app polls the conversation list every five seconds and an open conversation
every three seconds. Poll requests use the same bearer token as normal API requests, and only
conversation participants can list, read, send, or mark messages as read. Responses are merged by
message ID so repeated polls do not duplicate history. Temporary network failures are shown in the
chat screen while polling continues and can be retried with the refresh button. New messages also
create notifications.

Run the backend first:

```bash
npm install
PORT=3001 npm start
```

In another terminal, run the mobile app:

```bash
cd mobile
npm install
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3001 npm start
```

Use `http://127.0.0.1:3001` for an iOS simulator or web browser. For a physical phone, replace
the address with the computer's local-network IP address. Android emulators use `10.0.2.2` to
reach the host computer.
