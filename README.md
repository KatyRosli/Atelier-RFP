# 📱 Voice-to-RFP 

AgentTurn a 15-second spoken walk-through note into an interactive Proposales proposal in seconds.This app addresses a real-world workflow problem for hotel MICE (Meetings, Incentives, Conferences, and Exhibitions) sales managers who host on-site venue tours.

## 🚀 Run Locally

### 💻 Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **pnpm**

### 🏁 Quickstart

1. **Clone the repository & install dependencies:**
   ```bash
   npm install


### 🎯 The Core Problem & Solution

The Problem: Hotel sales reps take mental or paper notes during 45-minute venue tours. Waiting until the end of the day to draft proposals manually creates delays—and slow response times lose deals to faster competitors.

The AI Solution: Immediately after a tour, the rep records a short voice note on their phone. The app parses the spoken audio into structured RFP line items (room counts, catering packages, dates) using the Vercel AI SDK, auto-generates a proposal via the Proposales API, and returns a live contract link before the client even leaves the parking lot.

The Impact: Cuts proposal generation time from ~30 minutes to ~30 seconds (a ~98% speed increase).

### 🏗️ Architecture & Data Flow

[ User Voice ] ──> [ Browser Web Speech API ] ──> [ Vercel AI SDK (generateObject) ] 
                                                                │
[ Live Proposales Contract Link ] <── [ Proposales API ] <── [ LLM: GPT-4o-mini ]

### 🛠️ Architectural Highlights & Patterns
This project was built with a strong focus on modularity, clear separation of concerns, and defensive integration logic:
- Repository Pattern (src/db/): Isolates all Drizzle ORM calls (proposals.ts, users.ts). Route handlers call domain methods (getProposals(), upsertProposal()) rather than executing queries directly, enabling easy database swaps or caching additions.
- Facade over External API (server/services/proposales-client.ts): Hides Proposales' distinct endpoints (differing base paths and auth mechanisms) behind clean, unified helper functions.
- Router-per-Resource (server/routes/): Dedicated Express routers handle single domains (/health, /extract, /proposals), adhering to the Single Responsibility Principle.
- Centralized Configuration (server/config.ts): Single source of truth for all process.env variables, preventing runtime environment bugs across deployments.
- Shared Pure Logic (src/lib/pricing.ts): Isomorphic TypeScript modules shared directly between the Vite-bundled frontend and the esbuild-bundled Express backend to guarantee single-source pricing logic.
- Schema Validation at Boundaries (Zod): Output from /api/extract and input to /api/proposals are parsed via RfpPayloadSchema to maintain strict boundary safety. 
- Graceful Degradation: The Proposales integration automatically falls back across three operational tiers (Full API Key + Company ID $\rightarrow$ Inbox Token $\rightarrow$ Unconfigured local state) so the application remains functional even without complete API credentials.

### 🔍 Honest Gaps & Technical Debt
Because this case study prioritizes thought process and speed over absolute polish, the following trade-offs were intentionally accepted:
- Frontend Monolith (App.tsx): Primary state management and data fetching currently reside within App.tsx. Next step: extract custom hooks (useProposals(), useUserProfile()).
- Fallback Strategy Structure: Provider fallback mechanisms (OpenAI $\rightarrow$ Gemini $\rightarrow$ heuristics) rely on nested try/catch blocks rather than an extensible Strategy Pattern array.
- Test Coverage: Logic is decoupled into testable units (pricing.ts, proposales-client.ts), but unit tests are not yet implemented.
- Single-Tenant Model: Lacks authentication, per-tenant data isolation, and rate-limiting.
- Uncached API Hits: Profile loads fetch directly from /api/proposales/company on every request without a TTL cache layer.
- Logging: Basic console.log / console.warn outputs are used rather than structured, request-correlated JSON logs.

### 🔮 Future Roadmap (Prioritized)
1. Targeted Testing: Add unit tests around decoupled pricing and external API client services.
2. Frontend Refactoring: Extract monolithic state management in App.tsx into custom React hooks.
3. Multi-Tenant Support: Introduce user auth and multi-account data segregation.
4. UX & Domain Lingo Refinement: Tailor interface wording to match hospitality sales terminology and streamline the "Jobs-to-be-Done" mobile layout.
5. Observability: Implement structured JSON logging and request tracing.
