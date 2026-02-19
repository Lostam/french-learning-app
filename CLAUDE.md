# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **contextual vocabulary learning application** with a split architecture:

- **Backend (`vocab-api`)**: Node.js + Express + PostgreSQL + Prisma API
- **Frontend (`vocab-app`)**: Next.js 14 PWA with mobile-first design

The app allows users to read stories in a foreign language, tap words to get contextual definitions (powered by Claude API), save vocabulary with spaced repetition, and track learning progress.

## Architecture

### Backend Stack
- Runtime: Node.js + TypeScript
- Framework: Express.js
- Database: PostgreSQL with Prisma ORM
- Auth: JWT tokens
- LLM: Anthropic Claude API (@anthropic-ai/sdk)
- Key features: User auth, story CRUD, AI story generation, contextual vocabulary definitions, SM-2 spaced repetition

### Frontend Stack
- Framework: Next.js 14 (App Router, used as SPA/PWA)
- UI: Tailwind CSS + shadcn/ui
- State: Zustand for auth and review session state
- PWA: Manifest + service worker for offline capability
- Mobile-first design with bottom navigation

### Data Model (Prisma Schema)

Core entities:
- **User**: email, passwordHash, nativeLanguage (default "he" for Hebrew)
- **Story**: title, content, language, source (USER_ADDED | AI_GENERATED), difficultyLevel
- **Sentence**: text, position (parsed from story content)
- **VocabularyWord**: word, definition, translation, contextNote, partOfSpeech (linked to sentence and story)
- **ReviewCard**: SM-2 algorithm fields (easeFactor, intervalDays, repetitions, nextReviewAt)
- **ReviewLog**: quality ratings and timestamps

Key relationships:
- Story → Sentences (1:many, cascade delete)
- Sentence → VocabularyWords (1:many)
- VocabularyWord → ReviewCard (1:1, cascade delete)

## Backend Development

### Commands

**Setup:**
```bash
npm install
npx prisma generate
npx prisma migrate dev
```

**Development:**
```bash
npm run dev          # Start with nodemon
npm run build        # Compile TypeScript
npm start            # Run production build
npm test             # Run tests
```

**Database:**
```bash
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Create and apply migration
npx prisma migrate dev --name <name>  # Named migration
npx prisma db push             # Push schema without migration (dev only)
```

### Project Structure

```
vocab-api/
├── src/
│   ├── index.ts                 # Express app entry
│   ├── config/env.ts            # Environment variable validation
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification, adds userId to request
│   │   ├── errorHandler.ts     # Global error handler
│   │   └── rateLimit.ts         # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.ts       # /auth/signup, /auth/login, /auth/me
│   │   ├── stories.routes.ts    # CRUD + /stories/generate
│   │   ├── vocabulary.routes.ts # /vocabulary/lookup, CRUD
│   │   ├── review.routes.ts     # /review/due, /review/:cardId
│   │   └── progress.routes.ts   # /progress/stats, /progress/weekly, /progress/heatmap
│   ├── services/
│   │   ├── auth.service.ts      # bcrypt hashing, JWT signing/verification
│   │   ├── story.service.ts     # Story CRUD, sentence parsing
│   │   ├── vocabulary.service.ts # Word CRUD, definition lookup via Claude
│   │   ├── review.service.ts    # SM-2 logic, due cards
│   │   ├── llm.service.ts       # Claude API wrapper
│   │   └── progress.service.ts  # Stats calculations
│   ├── lib/
│   │   ├── sm2.ts               # Pure SM-2 algorithm function
│   │   ├── sentenceParser.ts    # Text → sentences array
│   │   └── prisma.ts            # Prisma client singleton
│   └── types/index.ts           # Shared types
├── tests/                       # Unit and integration tests
└── prisma/schema.prisma
```

### API Endpoints Reference

**Auth:**
- `POST /auth/signup` → { token, user }
- `POST /auth/login` → { token, user }
- `GET /auth/me` → { user }

**Stories:**
- `GET /stories` → { stories[] }
- `POST /stories` → { story }
- `POST /stories/generate` → { story } (AI generation)
- `GET /stories/:id` → { story with sentences }
- `DELETE /stories/:id`

**Vocabulary:**
- `GET /vocabulary?storyId=<id>` → { words[] with context }
- `POST /vocabulary/lookup` → { definition, translation, partOfSpeech, contextNote }
- `POST /vocabulary` → { vocabWord }
- `DELETE /vocabulary/:id`

**Review (Spaced Repetition):**
- `GET /review/due` → { cards[] }
- `PUT /review/:cardId` → { updatedCard }
- `GET /review/summary` → { todayReviewed, accuracy, streak }

**Progress:**
- `GET /progress/stats` → { totalWords, dueToday, streak, retention }
- `GET /progress/weekly` → { weeklyData[] }
- `GET /progress/heatmap` → { dailyCounts[] }

### Key Implementation Details

**Sentence Parser:**
- Handles abbreviations (Mr., Dr., etc.), dialogue, ellipsis
- Returns array of sentences with accurate boundary detection
- Located in `src/lib/sentenceParser.ts`

**SM-2 Algorithm:**
- Pure function in `src/lib/sm2.ts`
- Input: { quality (0-5), easeFactor, intervalDays, repetitions }
- Output: { easeFactor, intervalDays, repetitions, nextReviewAt }
- Quality < 3 resets card, >= 3 advances using standard SM-2 formula

**Claude API Integration:**
- Used in two places:
  1. **Vocabulary lookup**: Haiku model provides contextual definition given sentence + word
  2. **Story generation**: Sonnet model generates story from topic/difficulty/length params
- Prompts return JSON responses (definition object or story object)
- Wrapper in `src/services/llm.service.ts`

**Auth Middleware:**
- Verifies JWT from `Authorization: Bearer <token>` header
- Attaches `userId` to request object for use in routes
- All routes except `/auth/*` and `/health` require authentication

## Frontend Development

### Commands

**Setup:**
```bash
npm install
```

**Development:**
```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm start            # Run production server
npm run lint         # Run ESLint
```

### Project Structure

```
vocab-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with bottom nav
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── stories/
│   │   │   ├── page.tsx         # Story library
│   │   │   ├── new/page.tsx     # Add/generate story
│   │   │   └── [id]/page.tsx    # Reader view (CORE FEATURE)
│   │   ├── vocabulary/page.tsx  # Word list
│   │   ├── practice/page.tsx    # Review session
│   │   └── progress/page.tsx    # Stats dashboard
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx    # Mobile navigation
│   │   │   └── Header.tsx
│   │   ├── reader/
│   │   │   ├── StoryReader.tsx
│   │   │   ├── HighlightableText.tsx
│   │   │   └── WordBottomSheet.tsx
│   │   ├── practice/
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── ClozeCard.tsx    # Sentence with blank
│   │   │   ├── DefinitionCard.tsx
│   │   │   └── RatingButtons.tsx
│   │   ├── stories/
│   │   │   ├── StoryCard.tsx
│   │   │   ├── StoryForm.tsx
│   │   │   └── GenerateForm.tsx
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts               # API client with auth headers
│   │   └── types.ts             # API response types
│   ├── stores/
│   │   ├── authStore.ts         # Zustand store for JWT + user
│   │   └── reviewStore.ts       # Practice session state
│   └── hooks/
│       ├── useApi.ts            # Fetch wrapper
│       └── useWordHighlight.ts
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/
└── next.config.js
```

### API Client Pattern

The app uses a centralized API client (`src/lib/api.ts`):

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Automatically includes JWT token from localStorage
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  // Error handling...
  return res.json();
}
```

All API calls go through this client for consistent auth and error handling.

### Core Feature: Story Reader

The reader (`/stories/[id]`) is the most important screen:

1. Each word is wrapped in a tappable `<span>`
2. Tapping a word:
   - Strips punctuation
   - If already saved: shows saved definition in bottom sheet
   - If new: calls `/vocabulary/lookup`, shows loading, then definition
3. Bottom sheet displays: word, part of speech, definition, translation, context note, and "Save" button
4. Saved words have a colored underline
5. Punctuation handling: "hello," → highlight "hello", "don't" stays as one word

**UX Requirements:**
- Min 44px tap targets (via padding)
- Smooth animations on highlight and bottom sheet
- Loading skeletons during API calls
- Mobile-optimized bottom sheet (slide up from bottom)

### Practice Session

Two card types shown randomly:
- **Cloze Card**: Sentence with target word replaced by "______"
- **Definition Card**: Word + highlighted sentence, then reveal definition

Rating buttons map to SM-2 quality:
- Again = 0
- Hard = 3
- Good = 4
- Easy = 5

### Mobile & PWA Considerations

- Bottom navigation (4 tabs: Stories, Practice, Vocabulary, Progress)
- Safe area insets for notched phones (`env(safe-area-inset-*)`)
- Pull-to-refresh on lists
- Haptic feedback where available
- Dark mode support (system preference)
- Service worker for offline app shell
- Add-to-home-screen prompt

## Environment Variables

**Backend (`.env`):**
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development Workflow

**Phase 1: Backend Foundation**
- B0: Project setup (Express + Prisma)
- B1: Auth routes + middleware
- B2: Story CRUD + sentence parser
- B3: Vocabulary + Claude definition lookup
- B4: Review routes + SM-2 implementation

**Phase 2: Frontend Foundation**
- F0: Next.js setup + API client
- F1: Auth screens
- F2: Story library + add/generate
- F3: Story reader with highlighting

**Phase 3: Complete Features**
- B5: Story generation endpoint
- B6: Progress endpoints
- F4: Vocabulary page
- F5: Practice session
- F6: Progress dashboard

**Phase 4: Polish**
- F7: PWA finalization, mobile polish, dark mode

### Testing Strategy

- Backend: Unit tests for `sm2.ts` and `sentenceParser.ts`, integration tests for routes
- Frontend: Test reader highlighting logic, practice session state management
- Manual testing: Test all API endpoints with curl/Postman before connecting frontend

## Important Notes for Claude Code

**Backend:**
- Keep services thin — business logic in service layer, routes just validate + call services
- Test each route with curl before moving on
- Write tests alongside implementation for `sm2.ts` and `sentenceParser.ts`

**Frontend:**
- Always specify "mobile-first" and "shadcn/ui" in prompts
- Reference API contracts explicitly when implementing screens
- For reader (F3), iterate in small pieces: tap detection → API call → bottom sheet
- Large tap targets (44px minimum) for all interactive elements

**Connecting Backend + Frontend:**
- During development: backend on `localhost:3001`, frontend on `localhost:3000`
- Backend CORS must allow `localhost:3000` during dev
- Set `NEXT_PUBLIC_API_URL=http://localhost:3001` in frontend `.env.local`

**Security:**
- Never commit `.env` files
- All routes except `/auth/*` and `/health` require authentication
- Passwords hashed with bcrypt before storage
- JWT tokens should have reasonable expiry (e.g., 7 days)

**Claude API Usage:**
- Haiku for vocabulary lookups (fast + cheap)
- Sonnet for story generation (higher quality)
- Always expect JSON responses from LLM, parse and validate
