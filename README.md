# NestMate roommate matching

## Current state

The repository currently contains a minimal NestJS backend foundation for the matching feature.
The matching module defines the profile shape and repository boundary, but it does not yet
persist profiles or calculate compatibility scores.

## Development

```bash
npm install
npm run build
npm test
```

The next backend step is to agree on the profile data source and add its repository implementation
before introducing the matching score and API endpoint.
