# NestMate roommate matching

## Current state

The repository contains a NestJS backend written in JavaScript. It uses in-memory repositories for
users and profiles, so data is available while the backend is running. Replace those repositories
with a database implementation before production use.

## Development

```bash
npm install
npm run build
npm test
```

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

`GET /api/matches?profileId=<id>` loads the user's profile with
`MatchingProfileRepository.findProfile`, loads candidates with
`MatchingProfileRepository.findCandidates`, and ranks them with `rankMatches`.

`PUT /api/matches/<profileId>/preferences` saves or updates the authenticated user's preferences.
Passwords are stored as bcrypt hashes and access tokens expire after one hour. Logout revokes the
current token in the running process.

The response has this shape:

```json
{
  "profileId": "user-1",
  "matches": [
    {
      "candidateId": "candidate-1",
      "score": 88,
      "breakdown": {
        "budget": 0.8,
        "location": 1,
        "lifestyle": 0.5,
        "habitsAndPreferences": 1
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
