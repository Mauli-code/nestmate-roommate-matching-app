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
