# NestMate — Roommate Matching & Recommendation System
**Course:** Mobile Applications (2501010577)  
**Component:** Individual Core Contribution — Roommate Matching Engine

---

## 1. Executive Summary

The **Roommate Matching System** is the core intelligence module of NestMate. It provides authenticated seekers with personalized, quantitative compatibility rankings (0–100%) and qualitative explanations ("Why this match", compatibility strengths, and potential preference differences) across verified candidates.

The matching engine enforces strict user privacy, bidirectional blocking, deactivated-account exclusions, and page-based pagination, while utilizing bounded binary-search insertion to deliver sub-20ms recommendation latencies even with thousands of candidate profiles.

---

## 2. Profile Information Used in Matching

Each roommate profile evaluated by the engine consists of the following attributes:

| Field | Type | Description | Scoring Pillar |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique user identifier | Identity / deduplication |
| `budget` | Number | Representative monthly housing budget (in ₹) | Budget Pillar |
| `minBudget` / `maxBudget` | Number | Budget range specified by user (averaged for `budget`) | Ingestion validation |
| `preferredArea` | String | Target neighborhood or locality (e.g., "Central", "Koramangala") | Location Pillar |
| `moveInDate` | String | Target move-in date (e.g., "2026-12-01") | Display attribute |
| `lifestyle.sleepSchedule`| String | Sleeping cycle ("early-bird", "night-owl", "flexible") | Lifestyle Pillar |
| `lifestyle.cleanliness` | String | Tidiness preference ("high", "medium", "relaxed") | Lifestyle Pillar |
| `lifestyle.smoking` | Boolean | Smoking habit/tolerance (`true` / `false`) | Habits Pillar |
| `lifestyle.pets` | String / Boolean | Pet preference/tolerance (`true`, `false`, "cats", "dogs", "none") | Habits Pillar |
| `foodHabits` | String | Dietary preference ("vegetarian", "non-vegetarian", "any") | Search / Details |
| `drinking` | String | Social drinking habit ("never", "occasionally", "regularly") | Search / Details |

---

## 3. The Compatibility Algorithm

The compatibility algorithm evaluates candidates across **four distinct pillars**, each weighted equally at **25% (25 points)** for a maximum possible score of **100%**:

$$\text{Total Score} = \text{round}\Big(\big(S_{\text{budget}} + S_{\text{location}} + S_{\text{lifestyle}} + S_{\text{habits}}\big) \times 25\Big)$$

### Pillar 1: Budget Compatibility ($S_{\text{budget}} \in [0, 1]$)
Evaluates financial proximity using proportional relative difference:

$$S_{\text{budget}} = 1 - \frac{|\text{budget}_1 - \text{budget}_2|}{\max(\text{budget}_1, \text{budget}_2)}$$

* **Identical budgets:** Returns `1.0` (25 points).
* **Partially aligned budgets:** e.g., ₹10,000 vs ₹9,000: $1 - \frac{1000}{10000} = 0.9$ (22.5 points).
* **Incomplete/invalid budget:** If either profile lacks a valid positive finite budget, $S_{\text{budget}} = 0$.

### Pillar 2: Location Compatibility ($S_{\text{location}} \in \{0, 1\}$)
Compares geographic targets after whitespace-trimming and lowercasing:

$$S_{\text{location}} = \begin{cases} 1 & \text{if } \text{area}_1 = \text{area}_2 \\ 0 & \text{otherwise} \end{cases}$$

* Matches case-insensitively (e.g. `" Central "` matches `"central"`).
* If either location is missing or empty, $S_{\text{location}} = 0$.

### Pillar 3: Lifestyle Compatibility ($S_{\text{lifestyle}} \in [0, 1]$)
Compares daily living rhythms across two sub-factors (12.5 points each):

$$S_{\text{lifestyle}} = \frac{M(\text{sleepSchedule}_1, \text{sleepSchedule}_2) + M(\text{cleanliness}_1, \text{cleanliness}_2)}{2}$$

Where $M(a, b) = 1$ if normalized values match, and $0$ otherwise.

### Pillar 4: Habits and Preferences Compatibility ($S_{\text{habits}} \in [0, 1]$)
Compares personal habit tolerances across two sub-factors (12.5 points each):

$$S_{\text{habits}} = \frac{M(\text{smoking}_1, \text{smoking}_2) + M(\text{pets}_1, \text{pets}_2)}{2}$$

Where boolean-like values are normalized (e.g., `'no'` and `false` are considered matching non-smokers).

---

## 4. Match Quality Insights (Strengths & Differences)

In addition to numerical scores, the engine generates structured, data-grounded insights:

* **Compatibility Strengths (`strengths[]`):**
  * `"Similar budget preferences."` (if $S_{\text{budget}} \ge 0.75$)
  * `"Compatible location preferences."` (if $S_{\text{location}} = 1$)
  * `"Similar lifestyle choices."` (if both sleep schedule and cleanliness match)
  * `"Compatible daily habits."` (if smoking and pet preferences match)
* **Potential Differences (`differences[]`):**
  * `"Different budget expectations."` (if $S_{\text{budget}} < 0.75$ and both budgets exist)
  * `"Location preference differences."` (if target areas differ and both exist)
  * `"Different lifestyle preferences."` (if cleanliness or schedules differ)
  * `"Different habits or schedules."` (if smoking or pet tolerances differ)

> **Integrity Rule:** Insights are generated **only from actual profile data**. If a field is missing, no explanation or insight is invented.

---

## 5. Candidate Ranking & Performance Optimizations

1. **Pre-normalization (`normalizeProfile`):**
   The requesting user's profile is normalized once before comparing against the candidate pool. This avoids re-trimming strings and re-validating numbers thousands of times.
2. **Bounded Binary Insertion ($O(N \log K)$):**
   Instead of sorting the entire candidate array with an $O(N \log N)$ algorithm, `rankMatches(userProfile, candidateProfiles, maxResults)` maintains a sorted window of size $K = \text{page} \times \text{limit}$. New candidates are inserted via binary search, capping memory consumption and runtime.
3. **Deterministic Stable Tie-Breaking:**
   When two candidates achieve identical compatibility scores, their original repository order (`originalIndex`) is preserved, preventing recommendation jumping between reloads.

---

## 6. Safety, Privacy, and Eligibility Rules

Before any candidate is scored, `MatchingService` applies the following mandatory eligibility filters:

1. **Self-Exclusion:** A user cannot be matched with themselves (`candidateId === profileId`).
2. **Account Status:** Deactivated or pending accounts (`users.isActive(candidateUser) !== true`) are excluded.
3. **Privacy Settings:** If a user disabled public visibility (`privacy.showProfile !== true`), they are excluded from all recommendations.
4. **Moderation / Blocking:** If either user has blocked the other (`moderation.isBlockedBetween(u1, u2)`), the candidate is hidden.
5. **Deduplication:** Repeated entries sharing the same candidate ID are collapsed into a single valid candidate before ranking.

---

## 7. Step-by-Step Sample Calculation Example

### Seeker Profile (Alex):
* Budget: ₹1,000
* Preferred Area: `"Central"`
* Sleep: `"flexible"`, Cleanliness: `"high"`
* Smoking: `false`, Pets: `false`

### Candidate Profile (Sarah):
* Budget: ₹950
* Preferred Area: `"central"`
* Sleep: `"flexible"`, Cleanliness: `"high"`
* Smoking: `false`, Pets: `false`

### Step-by-Step Scoring:
1. **Budget:** $1 - \frac{|1000 - 950|}{\max(1000, 950)} = 1 - \frac{50}{1000} = 0.95$ (23.75 points)
2. **Location:** `"central" === "central"` $\rightarrow 1.00$ (25.00 points)
3. **Lifestyle:** Sleep match ($1$) + Cleanliness match ($1$) / $2 \rightarrow 1.00$ (25.00 points)
4. **Habits:** Smoking match ($1$) + Pets match ($1$) / $2 \rightarrow 1.00$ (25.00 points)
5. **Total Raw Score:** $(0.95 + 1.00 + 1.00 + 1.00) \times 25 = 98.75$
6. **Final Compatibility Score:** $\text{round}(98.75) = \mathbf{99\%}$

---

## 8. REST API Documentation

### 8.1. Get Roommate Recommendations

#### Request
```http
GET /api/matches?page=1&limit=10 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <JWT_TOKEN>
```

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | Integer | No | `1` | Positive page index ($\ge 1$) |
| `limit` | Integer | No | `10` | Page size ($\ge 1$, capped at `50`) |
| `profileId`| String | No | Authenticated User | Optional profile ID (must match token subject) |

#### Success Response (`200 OK`)
```json
{
  "profileId": "user-123",
  "page": 1,
  "limit": 10,
  "total": 24,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false,
  "matches": [
    {
      "candidateId": "cand-456",
      "score": 96,
      "breakdown": {
        "budget": 0.95,
        "location": 1,
        "lifestyle": 1,
        "habitsAndPreferences": 0.9
      },
      "explanations": {
        "budget": { "status": "strong match", "text": "Budgets are closely aligned." },
        "location": { "status": "match", "text": "Preferred locations match." },
        "lifestyle": { "status": "strong match", "text": "2 of 2 available lifestyle preferences match." },
        "habitsAndPreferences": { "status": "strong match", "text": "2 of 2 available habits preferences match." },
        "overall": { "status": "strong match", "text": "96% overall compatibility across the available factors." }
      },
      "strengths": [
        "Similar budget preferences.",
        "Compatible location preferences.",
        "Similar lifestyle choices.",
        "Compatible daily habits."
      ],
      "differences": [],
      "insights": {
        "strengths": [
          "Similar budget preferences.",
          "Compatible location preferences.",
          "Similar lifestyle choices.",
          "Compatible daily habits."
        ],
        "differences": []
      }
    }
  ]
}
```

#### Error Responses
* **`400 Bad Request`**: Malformed pagination parameters (e.g. `page=0` or non-integer `limit`).
  ```json
  { "statusCode": 400, "message": "page must be a positive whole number" }
  ```
* **`401 Unauthorized`**: Missing, invalid, or expired JWT token.
  ```json
  { "statusCode": 401, "message": "Authentication token is expired or invalid" }
  ```
* **`403 Forbidden`**: User attempts to query another user's recommendations (`profileId !== token.sub`).
  ```json
  { "statusCode": 403, "message": "You can only access your own profile" }
  ```
* **`404 Not Found`**: Requesting user account does not exist or roommate preferences have not been saved.
  ```json
  { "statusCode": 404, "message": "Roommate preferences for \"user-123\" were not found" }
  ```

---

### 8.2. Save Roommate Preferences

#### Request
```http
PUT /api/matches/user-123/preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "minBudget": "800",
  "maxBudget": "1200",
  "preferredArea": "Central",
  "sleepSchedule": "flexible",
  "cleanliness": "high",
  "foodHabits": "vegetarian",
  "smoking": "no",
  "drinking": "occasionally",
  "moveInDate": "2026-12-01"
}
```

#### Success Response (`200 OK`)
```json
{
  "profile": {
    "id": "user-123",
    "budget": 1000,
    "minBudget": 800,
    "maxBudget": 1200,
    "preferredArea": "Central",
    "lifestyle": {
      "sleepSchedule": "flexible",
      "cleanliness": "high",
      "smoking": false,
      "pets": "not-specified"
    },
    "foodHabits": "vegetarian",
    "drinking": "occasionally",
    "moveInDate": "2026-12-01"
  },
  "message": "Preferences saved successfully"
}
```

---

## 9. Mobile Client Integration

The mobile application connects to the matching system through two client-side utilities:

1. **`mobile/src/api/matches.js` (`fetchMatches`)**:
   * Attaches the authenticated user's Bearer JWT.
   * Dispatches the HTTP request with query parameters.
   * Validates response structures and error codes (handling 401/403/404).
2. **`mobile/src/matching-details.js` (`getCompatibilityDetails`)**:
   * Normalizes match objects into UI-ready view models for `MatchCard` and `ProfileDetailsScreen`.
   * Formats percentages, category bars, and insight bullets (`✓` for strengths, `•` for differences).

---

## 10. Verification & Test Summary

The matching system is verified by **142 automated tests** across 8 test suites:

* `src/matching/compatibility-score.test.js` — Scoring formulas, factor weights, and insight generation.
* `src/matching/compatibility.test.js` — Budget and location compatibility math.
* `src/matching/rank-matches.test.js` — Candidate ranking, bounded binary insertion, and stable tie-breaking.
* `src/matching/preferences.test.js` — Preference validation and profile normalization.
* `src/matching/matching.service.test.js` — Candidate pagination, privacy filters, and large benchmarks (2,000 candidates in ~15ms).
* `src/matching/matching.controller.test.js` — Route handling, parameter shifting, and error passing.
* `src/matching/matching.auth.test.js` — Authentication guards, token lifecycle, and ID security.
* `src/matching/matching-edge-cases.test.js` — Edge cases (NaN, Infinity, whitespace lifestyle, invalid candidate objects).
* `src/matching/matching-integration.test.js` — End-to-end integration between mobile client and backend API.
