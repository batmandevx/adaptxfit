# Task 4 - Backend API Developer

## Task: Create API routes for data persistence

## Work Completed

### Routes Updated/Created

1. **src/app/api/exercise-logs/route.ts** - Updated
   - GET: userId (required), limit/offset pagination, since/createdAfter date filtering, `{ data, total }` response
   - POST: userId from body, validates exerciseName/category/duration, `{ data }` response

2. **src/app/api/mood-entries/route.ts** - Updated
   - GET: userId (required), limit/offset pagination, since/createdAfter date filtering, `{ data, total }` response
   - POST: userId from body, validates mood (1-5)/emotion, riskLevel validation, `{ data }` response

3. **src/app/api/nutrition-logs/route.ts** - Updated
   - GET: userId (required), limit/offset pagination, since/createdAfter date filtering, `{ data, total }` response
   - POST: userId from body, validates foodName/calories, mealType validation, `{ data }` response

4. **src/app/api/breathing-sessions/route.ts** - Updated
   - GET: userId (required), limit/offset pagination, since/createdAfter date filtering, `{ data, total }` response
   - POST: userId from body, validates pattern/durationSec/cyclesDone, pattern enum validation, `{ data }` response

5. **src/app/api/achievements/route.ts** - Created new
   - GET: userId (required), limit/offset pagination, since/createdAfter date filtering (uses earnedAt), `{ data, total }` response
   - POST: userId/title required, category validation against exercise/mood/nutrition/streak, `{ data }` response

### Key Design Decisions
- All GET routes require `userId` query param (return 400 if missing)
- Pagination: limit defaults to 30, max 100; offset defaults to 0
- Date filtering: both `since` and `createdAfter` params accepted (same behavior)
- Achievement date filter uses `earnedAt` instead of `createdAt` for semantic correctness
- All routes use try/catch with proper HTTP status codes (400, 500, 201)
- Response format standardized: `{ data: [...], total: number }` for GET, `{ data: record }` for POST
- Lint: 0 errors
