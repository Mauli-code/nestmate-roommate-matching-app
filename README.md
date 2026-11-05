# NestMate roommate matching

## Current state

The repository contains a minimal NestJS backend written in JavaScript. The matching module uses
plain profile objects and a repository boundary. The HTTP endpoint uses that boundary without
inventing persistence or authentication.

## Development

```bash
npm install
npm run build
npm test
```

The `rankMatches` function scores a user's candidates with the existing compatibility algorithm,
sorts them from highest to lowest, and returns each candidate ID, score, and score breakdown.

## Matching endpoint

`GET /api/matches?profileId=<id>` loads the user's profile with
`MatchingProfileRepository.findProfile`, loads candidates with
`MatchingProfileRepository.findCandidates`, and ranks them with `rankMatches`.

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

The repository is intentionally still an application boundary. Configure a real repository
implementation in `MatchingModule` before running the endpoint; otherwise it returns a service
unavailable response. Missing `profileId` returns `400`, an unknown profile returns `404`, and an
empty candidate list returns `200` with an empty `matches` array.

## Mobile app

The Expo React Native app is in [`mobile/`](./mobile/). Its home screen introduces NestMate and
provides a **Find roommates** entry point. The recommendations screen requests the endpoint when
the user enters a profile ID and taps **Find**. Each result shows the candidate ID, compatibility
score, rank, and every score-breakdown category. The mobile API helper validates and sorts the
response by descending score before rendering it. The current backend response exposes the
candidate profile identifier as the available profile information; additional profile fields can
be displayed later when the backend includes them. Loading, empty, network, and API error states
are shown in the screen instead of using hardcoded recommendations.

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

The current backend intentionally returns `503` until a real implementation of
`MATCHING_PROFILE_REPOSITORY` is configured. Once profiles are connected, the same screen will
display the live ranked recommendations.
