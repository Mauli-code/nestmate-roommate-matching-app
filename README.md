# NestMate roommate matching

## Current state

The repository currently contains a minimal NestJS backend foundation written in JavaScript.
The matching module uses plain profile objects and a repository boundary, but it does not yet
persist profiles or connect the compatibility score to an HTTP endpoint.

## Development

```bash
npm install
npm run build
npm test
```

The next backend step is to agree on the profile data source and add its repository implementation
before connecting the matching score to an API endpoint.

The `rankMatches` function scores a user's candidates with the existing compatibility algorithm,
sorts them from highest to lowest, and returns each candidate ID, score, and score breakdown.
