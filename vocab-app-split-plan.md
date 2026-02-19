# Contextual Vocabulary Learning App — Split Architecture Plan

## Architecture Overview

Two separate projects, developed independently with Claude Code:

```
┌─────────────────────┐         ┌─────────────────────┐
│   Frontend (PWA)    │  HTTP   │   Backend (API)      │
│   Next.js / React   │◄──────►│   Node.js + Express  │
│   Mobile-first UI   │  JSON   │   PostgreSQL + Prisma│
│   Vercel            │         │   Railway / Render    │
└─────────────────────┘         └─────────────────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │   Claude API     │
                                │   (Haiku/Sonnet) │
                                └─────────────────┘
```

### Why split?

- **Focused Claude Code sessions**: Backend tasks are pure logic/API, frontend tasks are pure UI — Claude Code performs better with focused scope
- **Independent deployment**: Deploy backend changes without touching frontend and vice versa
- **Testable API**: You can test the backend with curl/Postman before the frontend exists
- **Future flexibility**: Build a native mobile app later using the same API
- **Cleaner separation of concerns**: No mixing of server logic and React components

---

## Backend — `vocab-api`

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js (or Fastify) |
| Database | PostgreSQL (Supabase or any managed PG) |
| ORM | Prisma |
| Auth | JWT (issued on login, verified via middleware) |
| LLM | @anthropic-ai/sdk |
| Hosting | Railway / Render / Fly.io |

### Project Structure

```
vocab-api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── index.ts                    # Express app entry
│   ├── config/
│   │   └── env.ts                  # Environment variables
│   ├── middleware/
│   │   ├── auth.ts                 # JWT verification
│   │   ├── errorHandler.ts         # Global error handler
│   │   └── rateLimit.ts            # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.ts          # POST /auth/signup, /auth/login
│   │   ├── stories.routes.ts       # CRUD + generate
│   │   ├── vocabulary.routes.ts    # Word management
│   │   ├── review.routes.ts        # Spaced repetition
│   │   └── progress.routes.ts      # Stats
│   ├── services/
│   │   ├── auth.service.ts         # Password hashing, JWT
│   │   ├── story.service.ts        # Story CRUD + sentence parsing
│   │   ├── vocabulary.service.ts   # Word save + definition lookup
│   │   ├── review.service.ts       # SM-2 logic + due cards
│   │   ├── llm.service.ts          # Claude API wrapper
│   │   └── progress.service.ts     # Stats calculations
│   ├── lib/
│   │   ├── sm2.ts                  # SM-2 algorithm (pure function)
│   │   ├── sentenceParser.ts       # Text → sentences
│   │   └── prisma.ts               # Prisma client singleton
│   └── types/
│       └── index.ts                # Shared types & API contracts
├── tests/
│   ├── sm2.test.ts
│   ├── sentenceParser.test.ts
│   └── routes/
│       ├── auth.test.ts
│       ├── stories.test.ts
│       └── review.test.ts
├── package.json
├── tsconfig.json
├── .env
└── Dockerfile                      # For deployment
```

### API Endpoints

#### Auth
```
POST   /auth/signup          { email, password, nativeLanguage }  → { token, user }
POST   /auth/login           { email, password }                  → { token, user }
GET    /auth/me              (auth required)                      → { user }
```

#### Stories
```
GET    /stories              → { stories[] }
POST   /stories              { title, content, language }         → { story }
POST   /stories/generate     { topic, language, difficulty, length, includeWords? } → { story }
GET    /stories/:id          → { story with sentences }
DELETE /stories/:id          → { success }
```

#### Vocabulary
```
GET    /vocabulary                          → { words[] with sentence context }
GET    /vocabulary?storyId=xxx              → { words[] for specific story }
POST   /vocabulary/lookup                   { word, sentenceId }  → { definition, translation, ... }
POST   /vocabulary                          { word, sentenceId, definition, ... } → { vocabWord }
DELETE /vocabulary/:id                      → { success }
```

#### Review (Spaced Repetition)
```
GET    /review/due           → { cards[] with vocab + sentence }
PUT    /review/:cardId       { quality: 0-5 }                    → { updatedCard }
GET    /review/summary       → { todayReviewed, accuracy, streak }
```

#### Progress
```
GET    /progress/stats       → { totalWords, dueToday, streak, retention }
GET    /progress/weekly      → { weeklyData[] for chart }
GET    /progress/heatmap     → { dailyCounts[] for last 90 days }
```

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String          @id @default(cuid())
  email           String          @unique
  passwordHash    String
  nativeLanguage  String          @default("he")
  createdAt       DateTime        @default(now())
  stories         Story[]
  vocabWords      VocabularyWord[]
  reviewCards     ReviewCard[]
}

model Story {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  title           String
  content         String
  language        String      @default("en")
  source          StorySource @default(USER_ADDED)
  difficultyLevel Difficulty  @default(INTERMEDIATE)
  createdAt       DateTime    @default(now())
  sentences       Sentence[]
  vocabWords      VocabularyWord[]

  @@index([userId])
}

model Sentence {
  id        String   @id @default(cuid())
  storyId   String
  story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  text      String
  position  Int
  vocabWords VocabularyWord[]

  @@index([storyId, position])
}

model VocabularyWord {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  word          String
  sentenceId    String
  sentence      Sentence    @relation(fields: [sentenceId], references: [id])
  storyId       String
  story         Story       @relation(fields: [storyId], references: [id])
  definition    String
  translation   String?
  contextNote   String?
  partOfSpeech  String?
  createdAt     DateTime    @default(now())
  reviewCard    ReviewCard?

  @@unique([userId, word, sentenceId])
  @@index([userId])
  @@index([userId, storyId])
}

model ReviewCard {
  id              String    @id @default(cuid())
  vocabWordId     String    @unique
  vocabWord       VocabularyWord @relation(fields: [vocabWordId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  easeFactor      Float     @default(2.5)
  intervalDays    Int       @default(0)
  repetitions     Int       @default(0)
  nextReviewAt    DateTime  @default(now())
  lastReviewedAt  DateTime?
  reviewLogs      ReviewLog[]

  @@index([userId, nextReviewAt])
}

model ReviewLog {
  id         String   @id @default(cuid())
  cardId     String
  card       ReviewCard @relation(fields: [cardId], references: [id], onDelete: Cascade)
  quality    Int
  reviewedAt DateTime @default(now())

  @@index([cardId, reviewedAt])
}

enum StorySource {
  USER_ADDED
  AI_GENERATED
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

---

## Frontend — `vocab-app`

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) — used as SPA/PWA |
| UI | Tailwind CSS + shadcn/ui |
| HTTP Client | fetch or axios (with auth interceptor) |
| State | Zustand (lightweight, works well for mobile) |
| PWA | Serwist (or next-pwa) |
| Hosting | Vercel |

### Project Structure

```
vocab-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, bottom nav, PWA meta
│   │   ├── page.tsx                # Redirect to /stories or /login
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── stories/
│   │   │   ├── page.tsx            # Story library
│   │   │   ├── new/page.tsx        # Add / generate story
│   │   │   └── [id]/page.tsx       # Reader view
│   │   ├── vocabulary/page.tsx     # Word list
│   │   ├── practice/page.tsx       # Review session
│   │   └── progress/page.tsx       # Stats dashboard
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx       # Mobile bottom navigation
│   │   │   └── Header.tsx
│   │   ├── reader/
│   │   │   ├── StoryReader.tsx
│   │   │   ├── HighlightableText.tsx
│   │   │   └── WordBottomSheet.tsx
│   │   ├── practice/
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── ClozeCard.tsx
│   │   │   ├── DefinitionCard.tsx
│   │   │   └── RatingButtons.tsx
│   │   ├── stories/
│   │   │   ├── StoryCard.tsx
│   │   │   ├── StoryForm.tsx
│   │   │   └── GenerateForm.tsx
│   │   └── ui/                     # shadcn/ui
│   ├── lib/
│   │   ├── api.ts                  # API client (base URL + auth headers)
│   │   └── types.ts                # API response types (mirror backend)
│   ├── stores/
│   │   ├── authStore.ts            # JWT token, user info
│   │   └── reviewStore.ts          # Current practice session state
│   └── hooks/
│       ├── useApi.ts               # Fetch wrapper with error handling
│       └── useWordHighlight.ts
├── public/
│   ├── manifest.json
│   └── icons/
├── package.json
├── tailwind.config.ts
└── next.config.js
```

### API Client Pattern

```typescript
// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL; // e.g., https://vocab-api.railway.app

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}

export const api = {
  stories: {
    list: () => apiFetch<Story[]>('/stories'),
    get: (id: string) => apiFetch<StoryWithSentences>(`/stories/${id}`),
    create: (data: CreateStoryInput) => apiFetch<Story>('/stories', { method: 'POST', body: JSON.stringify(data) }),
    generate: (data: GenerateStoryInput) => apiFetch<Story>('/stories/generate', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/stories/${id}`, { method: 'DELETE' }),
  },
  vocabulary: {
    list: (storyId?: string) => apiFetch<VocabWord[]>(`/vocabulary${storyId ? `?storyId=${storyId}` : ''}`),
    lookup: (data: LookupInput) => apiFetch<Definition>('/vocabulary/lookup', { method: 'POST', body: JSON.stringify(data) }),
    save: (data: SaveWordInput) => apiFetch<VocabWord>('/vocabulary', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/vocabulary/${id}`, { method: 'DELETE' }),
  },
  review: {
    getDue: () => apiFetch<ReviewCardWithContext[]>('/review/due'),
    submit: (cardId: string, quality: number) => apiFetch<ReviewCard>(`/review/${cardId}`, { method: 'PUT', body: JSON.stringify({ quality }) }),
  },
  progress: {
    stats: () => apiFetch<ProgressStats>('/progress/stats'),
    weekly: () => apiFetch<WeeklyData[]>('/progress/weekly'),
  },
};
```

---

## Claude Code Development Steps

### Backend Steps (do these first)

#### B0: Project Setup
```
Create a Node.js + TypeScript + Express project called "vocab-api".
Set up Prisma with PostgreSQL. Add the schema I'll provide.
Add middleware for JSON parsing, CORS (allow all origins for now), and error handling.
Create a health check endpoint GET /health.
Install: express, prisma, @prisma/client, @anthropic-ai/sdk, bcryptjs, jsonwebtoken,
         cors, dotenv, zod (for validation).
Set up tsconfig, nodemon for dev, and a build script.
```

#### B1: Auth Routes
```
Create auth routes:
- POST /auth/signup: validate email + password with zod, hash password with bcrypt,
  create user in DB, return JWT token + user object
- POST /auth/login: verify email + password, return JWT token
- GET /auth/me: protected route, return current user from JWT

Create auth middleware that verifies JWT from Authorization: Bearer <token> header
and attaches userId to the request object.

Use jsonwebtoken for signing/verifying. JWT payload: { userId, email }.
JWT secret from environment variable.
```

#### B2: Story Routes
```
Create story routes (all protected with auth middleware):
- GET /stories: list all stories for current user, ordered by createdAt desc.
  Return: id, title, language, source, difficultyLevel, createdAt, wordCount (computed)
- POST /stories: create a new story. Accept { title, content, language }.
  Parse content into sentences (create a sentence parser utility that handles
  abbreviations, dialogue, ellipsis). Save Story + Sentences in a transaction.
- GET /stories/:id: return story with all sentences ordered by position.
  Also include which words the user has already highlighted (vocabWords for this story).
- DELETE /stories/:id: delete story and cascade to sentences + vocab words.

Create the sentence parser in src/lib/sentenceParser.ts with tests.
```

#### B3: Vocabulary + Definition Routes
```
Create vocabulary routes (all protected):
- POST /vocabulary/lookup: Accept { word, sentenceId }.
  Fetch the sentence from DB.
  Call Claude API (Haiku) with this prompt:

  "You are a vocabulary learning assistant. A user is reading a story and
   highlighted a word they don't understand.

   Sentence: "{sentence.text}"
   Word: "{word}"
   User's native language: {user.nativeLanguage}

   Provide a contextual definition — explain what this word means specifically
   in this sentence, not just a generic dictionary definition.

   Respond ONLY with JSON:
   {
     "definition": "contextual meaning in English",
     "translation": "translation in user's native language",
     "partOfSpeech": "noun/verb/adj/etc",
     "contextNote": "brief explanation of how the word is used in this specific context"
   }"

  Return the parsed JSON response.

- POST /vocabulary: Save a word. Accept { word, sentenceId, definition, translation,
  contextNote, partOfSpeech }. Create VocabularyWord + ReviewCard in a transaction.
  Enforce unique constraint on (userId, word, sentenceId).

- GET /vocabulary: List all vocab words for user with sentence context.
  Optional query param ?storyId= to filter by story.
  Include: word, definition, translation, partOfSpeech, sentence.text, story.title

- DELETE /vocabulary/:id: Delete word and its review card.
```

#### B4: Review Routes + SM-2
```
Implement the spaced repetition system:

1. Create src/lib/sm2.ts — pure function implementing the SM-2 algorithm:
   Input: { quality, easeFactor, intervalDays, repetitions }
   Output: { easeFactor, intervalDays, repetitions, nextReviewAt }

   Algorithm:
   - quality < 3: reset (repetitions=0, interval=1 day)
   - quality >= 3:
     - rep 0: interval = 1
     - rep 1: interval = 6
     - else: interval = round(interval * easeFactor)
     - repetitions++
   - easeFactor = max(1.3, ef + 0.1 - (5-q)*(0.08 + (5-q)*0.02))
   - nextReviewAt = now + interval days

   Write unit tests for this function.

2. Routes:
   - GET /review/due: Get all review cards where nextReviewAt <= now for current user.
     Include vocabWord (word, definition, translation, partOfSpeech) and
     sentence (text). Limit 20, ordered by nextReviewAt ASC.

   - PUT /review/:cardId: Accept { quality: 0-5 }.
     Run SM-2 calculation. Update ReviewCard. Create ReviewLog entry.
     Return updated card with new nextReviewAt.

   - GET /review/summary: Return { reviewedToday, totalDue, accuracy }
     where accuracy = % of today's reviews rated >= 3.
```

#### B5: Story Generation Route
```
Add AI story generation:
- POST /stories/generate: Accept { topic, language, difficulty, length, includeWords? }

  Call Claude API (Sonnet) with prompt:
  "Write a {difficulty} level story in {language} about: {topic}.
   Target length: {length} words.
   The story should be engaging, with natural dialogue and vivid descriptions.
   Use vocabulary appropriate for a {difficulty} language learner.
   {if includeWords: 'Naturally incorporate these vocabulary words: ' + includeWords.join(', ')}

   Respond ONLY with JSON:
   {
     "title": "story title",
     "content": "the full story text"
   }"

  Parse the response, create Story + Sentences (reuse sentence parser).
  Return the created story.
```

#### B6: Progress Routes
```
Create progress routes:
- GET /progress/stats: Return {
    totalWords: count of user's vocab words,
    wordsThisWeek: vocab words created in last 7 days,
    dueToday: review cards due today,
    streak: consecutive days with at least 1 review (from ReviewLog),
    retention: % of all reviews rated >= 3 in last 30 days
  }

- GET /progress/weekly: Return last 8 weeks of data:
  [{ week: "2026-W05", wordsLearned: 12, reviewsDone: 45 }, ...]

- GET /progress/heatmap: Return last 90 days:
  [{ date: "2026-02-06", count: 8 }, ...]
  where count = number of reviews done that day.
```

---

### Frontend Steps (start after B0-B3 are working)

#### F0: Project Setup
```
Create a Next.js 14 project with App Router, TypeScript, Tailwind CSS, and shadcn/ui.
Configure as a PWA with mobile-first viewport.
Set up the API client (src/lib/api.ts) that points to the backend URL
from NEXT_PUBLIC_API_URL env var. Include JWT auth header on every request.
Create a Zustand auth store that persists the JWT token in localStorage.
Set up a bottom navigation bar component with 4 tabs:
Stories, Practice, Vocabulary, Progress (use Lucide icons).
Add a mobile-friendly layout with safe area padding.
```

#### F1: Auth Screens
```
Create login and signup pages:
- /login: email + password form, calls backend POST /auth/login,
  stores JWT in auth store, redirects to /stories
- /signup: email + password + native language (dropdown), calls POST /auth/signup
- Add a route guard: if no token, redirect to /login
- Mobile-friendly forms with shadcn/ui Input and Button
- Show validation errors from the backend
```

#### F2: Story Library + Add Story
```
Create the story pages:
- /stories: Fetch GET /stories, show as a list of cards.
  Each card: title, language flag emoji, word count, date.
  Floating action button (+) to add new story.
  Empty state when no stories.

- /stories/new: Two tabs — "Paste Text" and "Generate with AI"
  Paste Text tab: title input, language dropdown, large textarea for content.
  Generate tab: topic input, language dropdown, difficulty selector,
  length selector (short/medium/long). Generate button with loading spinner.
  
  On submit, call the appropriate API endpoint and redirect to the reader.
```

#### F3: Story Reader with Highlighting (Core Feature)
```
Create the reader view at /stories/[id]:

This is the most important screen in the app. Requirements:

1. Fetch GET /stories/:id (includes sentences + already highlighted words)
2. Display the story title at top, then flowing text
3. Each word is wrapped in a tappable <span>
4. Tapping a word:
   - Strip punctuation from the word
   - If already highlighted: show saved definition in bottom sheet
   - If new: call POST /vocabulary/lookup, show loading state, then
     show definition in a bottom sheet with:
     - Word (large, bold)
     - Part of speech (badge)
     - Definition
     - Translation
     - Context note
     - "Save to vocabulary" button
   - On save: call POST /vocabulary, animate the word to show it's saved
5. Already-saved words have a subtle colored underline
6. Bottom sheet should slide up from bottom (mobile-native feel)
   Use a proper bottom sheet component (e.g., vaul or custom)
7. Reading progress indicator at top

Key UX details:
- Words must be large enough to tap on mobile (min 44px tap target via padding)
- Punctuation handling: "hello," → highlight "hello", "don't" stays as one word
- Loading state while definition is being fetched (show skeleton in bottom sheet)
- Smooth animations on highlight and bottom sheet
```

#### F4: Vocabulary Page
```
Create /vocabulary page:
- Fetch GET /vocabulary
- Group words by story (collapsible sections)
- Each word entry shows:
  - The word (bold) + part of speech badge
  - Definition (1 line, truncated)
  - Source sentence with the word highlighted/bold in it
- Tap to expand: shows full definition, translation, context note
- Delete button (with confirmation)
- Search bar at top to filter words
- Count badge showing total words and due-for-review count
- Empty state: "Start reading stories and highlighting words!"
```

#### F5: Practice Session
```
Create /practice page — the spaced repetition review UI:

1. On mount, fetch GET /review/due
2. If no cards due: show celebration screen with "All caught up!" and stats
3. Progress bar at top showing current/total cards

4. For each card, randomly show one of two types:

   CLOZE CARD:
   - Show source sentence with target word replaced by "______"
   - Story title shown as subtle label above
   - "Show Answer" button
   - On reveal: show the word filling the blank (animation) + definition below
   - Rating buttons: Again / Hard / Good / Easy (color-coded)

   DEFINITION CARD:
   - Show the word (large) + source sentence with word highlighted
   - "Show Answer" button
   - On reveal: show definition + translation
   - Same rating buttons

5. On rate: call PUT /review/:cardId with quality mapping:
   Again=0, Hard=3, Good=4, Easy=5
6. Advance to next card with slide animation
7. End screen: cards reviewed, % correct (rated >= Good), encouragement message

Card should be a centered component with generous padding.
Large tap targets for rating buttons.
Satisfying animations between cards.
```

#### F6: Progress Dashboard
```
Create /progress page with:
1. Stats row at top: Total Words | Due Today | Streak (days) | Retention %
   Use shadcn/ui Card for each stat
2. Weekly words learned bar chart (last 8 weeks) — use recharts BarChart
3. Review heatmap (last 90 days, GitHub-style grid) — build a simple
   grid component with color intensity based on review count
4. Fetch data from GET /progress/stats, /progress/weekly, /progress/heatmap
5. Loading skeletons while data fetches
```

#### F7: PWA & Polish
```
Finalize PWA and mobile experience:
1. manifest.json: app name "VocabReader", theme color, display standalone, icons
2. Service worker: cache app shell for offline loading
3. Add-to-home-screen prompt after 3rd visit
4. Polish all touch interactions:
   - Active states on all tappable elements
   - Haptic feedback hints (using vibration API where available)
   - Pull-to-refresh on story list
   - Swipe between practice cards
5. Safe area insets for notched phones (env(safe-area-inset-*))
6. Proper keyboard handling on input screens
7. Dark mode support (respect system preference)
8. Loading states and error states for every screen
9. Toast notifications for actions (word saved, story created)
```

---

## Environment Variables

### Backend (`vocab-api/.env`)
```
DATABASE_URL=postgresql://user:pass@host:5432/vocab
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (`vocab-app/.env.local`)
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## Development Workflow

```
Phase 1: Backend foundation (B0 → B4)
   ↓ Test all endpoints with curl/Postman
Phase 2: Frontend foundation (F0 → F3)
   ↓ Test reader + highlighting end-to-end
Phase 3: Backend completion (B5 → B6) + Frontend completion (F4 → F6)
   ↓ Can work on these in parallel
Phase 4: Polish (F7)
```

### Estimated Timeline

| Step | Description | Est. Time |
|------|-------------|-----------|
| B0 | Backend setup + Prisma | 1-2 hrs |
| B1 | Auth routes | 1-2 hrs |
| B2 | Story CRUD + parser | 2-3 hrs |
| B3 | Vocabulary + definitions | 2-3 hrs |
| B4 | Review + SM-2 | 2-3 hrs |
| B5 | Story generation | 1-2 hrs |
| B6 | Progress routes | 1-2 hrs |
| F0 | Frontend setup | 1-2 hrs |
| F1 | Auth screens | 1-2 hrs |
| F2 | Story library | 2-3 hrs |
| F3 | Reader + highlighting | 4-6 hrs |
| F4 | Vocabulary page | 2-3 hrs |
| F5 | Practice session | 3-4 hrs |
| F6 | Progress dashboard | 2-3 hrs |
| F7 | PWA + polish | 3-4 hrs |
| **Total** | | **~28-40 hrs** |

---

## Claude Code Tips

### For backend steps
- Ask Claude Code to write tests alongside the implementation
- Test each route with curl before moving on
- Keep services thin — business logic in service layer, routes just validate + call services

### For frontend steps
- Always specify "mobile-first" and "shadcn/ui" in your prompts
- Reference the API contract explicitly: "The endpoint returns { word, definition, sentence: { text } }"
- For the reader (F3), iterate in small pieces: first get tap detection working, then the API call, then the bottom sheet

### Connecting the two
- During development, run backend on localhost:3001, frontend on localhost:3000
- Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in frontend .env.local
- Backend CORS should allow localhost:3000 during dev
