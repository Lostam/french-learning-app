# Vocab API

Backend API for the French Learning App - A contextual vocabulary learning application with spaced repetition.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT tokens with bcryptjs
- **AI**: Anthropic Claude API (@anthropic-ai/sdk)

## Features

- User authentication (signup/login)
- Story management (CRUD + AI generation)
- Contextual vocabulary definitions powered by Claude
- SM-2 spaced repetition algorithm
- Progress tracking and statistics

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Anthropic API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL, JWT secret, and Anthropic API key
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:3001` (or the PORT specified in .env)

### Build & Production

Build the TypeScript code:
```bash
npm run build
```

Run the production build:
```bash
npm start
```

## Project Structure

```
vocab-api/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── config/               # Environment variable validation
│   ├── middleware/           # Auth, error handling, rate limiting
│   │   └── errorHandler.ts  # Global error handler
│   ├── routes/               # API routes (to be implemented)
│   ├── services/             # Business logic layer (to be implemented)
│   ├── lib/                  # Utilities and helpers
│   │   └── prisma.ts        # Prisma client singleton
│   └── types/                # TypeScript type definitions
│       └── index.ts         # Shared types
├── prisma/
│   └── schema.prisma        # Database schema with all models
└── tsconfig.json            # TypeScript configuration
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Auth (To be implemented)
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Stories (To be implemented)
- `GET /stories` - List user's stories
- `POST /stories` - Create new story
- `POST /stories/generate` - AI-generate story
- `GET /stories/:id` - Get story with sentences
- `DELETE /stories/:id` - Delete story

### Vocabulary (To be implemented)
- `GET /vocabulary` - List saved vocabulary words
- `POST /vocabulary/lookup` - Get contextual definition
- `POST /vocabulary` - Save vocabulary word
- `DELETE /vocabulary/:id` - Delete vocabulary word

### Review (To be implemented)
- `GET /review/due` - Get cards due for review
- `PUT /review/:cardId` - Submit review rating
- `GET /review/summary` - Review statistics

### Progress (To be implemented)
- `GET /progress/stats` - Overall progress statistics
- `GET /progress/weekly` - Weekly activity data
- `GET /progress/heatmap` - Daily review heatmap

## Database Schema

Key models:
- **User**: Authentication and user settings
- **Story**: User-added or AI-generated stories
- **Sentence**: Parsed sentences from stories
- **VocabularyWord**: Saved words with contextual definitions
- **ReviewCard**: SM-2 spaced repetition data
- **ReviewLog**: Review history and ratings

## Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm test` - Run tests (not yet implemented)

## Database Commands

```bash
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Create and apply migration
npx prisma migrate dev --name <name>  # Named migration
npx prisma db push             # Push schema without migration (dev only)
npx prisma generate            # Regenerate Prisma Client
```

## Next Steps

1. Implement authentication routes and middleware
2. Create story CRUD endpoints with sentence parser
3. Implement vocabulary lookup using Claude API
4. Build review system with SM-2 algorithm
5. Add progress tracking endpoints
6. Write unit tests for core logic
7. Add API documentation (Swagger/OpenAPI)

## License

ISC
