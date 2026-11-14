# Authentication and profiles

The mobile app sends JSON to the backend. Authenticated requests include `Authorization: Bearer <accessToken>`. The API issues tokens that expire after one hour.

## Endpoints

### Register

`POST /api/auth/register`

Request:

```json
{
  "fullName": "Sam Lee",
  "email": "sam@example.com",
  "password": "nestmate123"
}
```

Response:

```json
{
  "user": {
    "id": "user-id",
    "fullName": "Sam Lee",
    "email": "sam@example.com",
    "photoUrl": null
  },
  "accessToken": "jwt-token"
}
```

### Log in and log out

`POST /api/auth/login` accepts `email` and `password` and returns the same user and token fields as registration.

`POST /api/auth/logout` needs a bearer token and returns `{ "message": "Logged out successfully" }`. The logged-out token is rejected after logout.

### Read and edit the profile

`GET /api/auth/profile` needs a bearer token. It returns the signed-in user's public details and that user's saved matching preferences:

```json
{
  "user": {
    "id": "user-id",
    "fullName": "Sam Lee",
    "email": "sam@example.com",
    "photoUrl": null,
    "occupation": "student",
    "city": "Pune",
    "bio": "Looking for a quiet flatmate.",
    "phone": "+91 98765 43210"
  },
  "preferences": {
    "id": "user-id",
    "minBudget": 8000,
    "maxBudget": 16000,
    "preferredArea": "Baner",
    "lifestyle": {
      "sleepSchedule": "flexible",
      "cleanliness": "medium",
      "smoking": false,
      "pets": "any"
    },
    "foodHabits": "vegetarian",
    "drinking": "never"
  }
}
```

Use `PATCH /api/auth/profile` to edit any of `fullName`, `occupation`, `city`, `bio`, or `phone`. `PUT /api/auth/profile` is also supported for clients that already use it. The NestMate mobile app uses `PATCH` for profile edits. Send only fields that changed. Phone is included only in the signed-in user's profile response.

Example:

```json
{
  "occupation": "working",
  "city": "Pune",
  "bio": "Looking for a quiet flatmate."
}
```

### Save roommate preferences

`PUT /api/matches/:profileId/preferences` needs a bearer token. The profile ID must match the signed-in user's ID.

```json
{
  "minBudget": "8000",
  "maxBudget": "16000",
  "preferredArea": "Baner",
  "sleepSchedule": "flexible",
  "foodHabits": "vegetarian",
  "cleanliness": "medium",
  "smoking": "no",
  "drinking": "never",
  "pets": "any"
}
```

The response contains a `profile` with the saved matching fields and a message. The matching endpoint reads this profile when it ranks roommates.

### Change password

`POST /api/auth/change-password` needs a bearer token and the current password. It increments the account's auth version, so previously issued tokens stop working.

```json
{
  "oldPassword": "nestmate123",
  "newPassword": "newnestmate123"
}
```

The app asks the user to log in again after a successful password change.

### Profile photo

`POST /api/auth/profile/photo` needs a bearer token and a multipart `photo` file. JPEG, PNG, and WebP images up to 5 MB are accepted.

## Validation and errors

Names must contain 2 to 80 characters. Email must be a valid address of at most 254 characters. Passwords must be 8 to 128 characters with at least one letter and one number.

Occupation is `student` or `working`. City is required when supplied and can contain up to 80 characters. Bio can be empty and is limited to 200 characters. Phone is optional; an empty string clears it. A supplied phone number must contain 7 to 15 digits, use at most 20 characters, and may include spaces, parentheses, hyphens, and a leading plus sign.

Budgets must be positive whole rupee amounts up to 10,000,000, and maximum must be at least minimum. Preferred area is required and limited to 100 characters. Sleep schedule, food habits, cleanliness, smoking, and drinking are required non-empty strings of at most 40 characters. Pets can be `yes`, `no`, or `any` in the mobile form.

Validation responses use HTTP 400 and identify fields so the form can place each message under its input:

```json
{
  "message": "Please check the highlighted fields",
  "errors": {
    "maxBudget": "Maximum budget must be at least the minimum."
  }
}
```

Duplicate email returns 409 with an `email` error. Incorrect credentials and invalid or expired tokens return 401. A network failure is shown by the mobile app as a connection message.

User responses never include `passwordHash` or internal account fields. Phone is returned only by the signed-in user's profile endpoint and is not part of roommate match results.

## Mobile screens

- `/(auth)/register` calls `POST /api/auth/register` and stores the returned session.
- `/(auth)/login` calls `POST /api/auth/login` and restores the same session on the next app launch.
- `/onboarding` saves basics with `PATCH /api/auth/profile`, then sends the budget, area, lifestyle, and habit fields to `PUT /api/matches/:profileId/preferences`.
- `/(tabs)/profile` loads `GET /api/auth/profile`, edits profile fields with `PATCH`, saves preferences with the same `PUT` endpoint, and can change password or upload a photo.
- Home and Discover request ranked matches using the signed-in user's ID and token. Logging out calls `POST /api/auth/logout` and clears local session storage.
