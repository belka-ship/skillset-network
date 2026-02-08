# Skillset.network

## Overview

Skillset.network is a decentralized platform where users capture POV (point-of-view) video data to train robotics foundation models. The platform operates on a simple loop: users browse available robotic tasks, upload POV video footage demonstrating those tasks, and earn $SKILL tokens as rewards. The current implementation is a Phase 1 MVP focused on establishing core functionality with user authentication, task browsing, simulated uploads, and token balance tracking.

The application follows a modern full-stack architecture with a React frontend and Express backend, styled with a dark, futuristic aesthetic inspired by platforms like Silencio.network and Figure.ai.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools**
- React with Vite for development and production builds
- TypeScript for type safety across the codebase
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching

**UI & Styling**
- Tailwind CSS v4 for utility-first styling with custom design tokens
- Shadcn/UI component library (New York variant) for pre-built, accessible components
- Radix UI primitives for complex interactive components (dialogs, dropdowns, etc.)
- Framer Motion for animations and transitions
- Custom fonts: Inter (sans-serif) and JetBrains Mono (monospace) for data/tokens

**Design System**
- Dark mode theme with pure black backgrounds (#000000)
- High-contrast white text for readability
- Neon green or electric blue accents for interactive elements
- Glassmorphism effects with translucent backgrounds
- Custom CSS variables for consistent theming

**State Management**
- Local React state (useState) for UI interactions and immediate updates
- TanStack Query for server state caching and synchronization
- Session-based authentication state managed through API calls

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server framework
- Node.js with ES modules (type: "module")
- HTTP server created with Node's built-in `http` module for potential WebSocket support

**Authentication & Session Management**
- Passport.js with Local Strategy for username/password authentication
- Express-session for session management
- MemoryStore for development (session storage in memory)
- bcrypt for password hashing with 10 salt rounds
- Session cookies with 7-day expiration

**API Design**
- RESTful API endpoints under `/api` prefix
- JSON request/response format
- Session-based authentication (cookies)
- Routes organized in separate `routes.ts` file

**Build & Deployment**
- Custom build script using esbuild for server bundling
- Vite for client bundling
- Dependency allowlist for bundling specific packages to reduce cold start times
- Separate development and production modes

### Data Storage

**ORM & Database**
- Drizzle ORM for type-safe database queries
- PostgreSQL as the primary database (via Neon serverless)
- WebSocket connection for serverless compatibility
- Schema-first approach with TypeScript types generated from Drizzle schemas

**Database Schema**
- **Users table**: Stores user credentials and token balances
  - id (UUID primary key)
  - username (unique text)
  - password (hashed text)
  - balance (integer, default 0)

- **Tasks table**: Defines available robotic tasks/bounties
  - id (UUID primary key)
  - title (text)
  - difficulty (text: "Low", "Medium", "High")
  - reward (integer: token amount)
  - description (optional text)

- **Uploads table**: Tracks user submissions
  - id (UUID primary key)
  - userId (foreign key to users)
  - taskId (foreign key to tasks)
  - uploadedAt (timestamp)

**Data Access Layer**
- Storage interface (IStorage) abstracts database operations
- DbStorage class implements the interface using Drizzle ORM
- Methods for user management, task retrieval, and upload tracking
- Business logic includes preventing duplicate task completions per user

### External Dependencies

**Database & Infrastructure**
- Neon (Serverless PostgreSQL): Cloud-hosted PostgreSQL with WebSocket support
- Environment variable: `DATABASE_URL` for database connection
- Environment variable: `SESSION_SECRET` for session encryption

**Authentication**
- Passport.js: Authentication middleware
- bcrypt: Password hashing library

**Development Tools**
- Replit-specific plugins for development environment:
  - vite-plugin-runtime-error-modal for error overlay
  - vite-plugin-cartographer for code mapping
  - vite-plugin-dev-banner for development indicators
  - Custom vite-plugin-meta-images for OpenGraph image management

**UI Component Libraries**
- Radix UI: Headless component primitives (@radix-ui/react-*)
- Lucide React: Icon library
- cmdk: Command menu component
- Framer Motion: Animation library
- date-fns: Date formatting utilities

**Form Handling**
- React Hook Form with @hookform/resolvers
- Zod for schema validation (integrated with Drizzle)

**Type Safety**
- Zod for runtime validation
- Drizzle-Zod integration for database schema validation
- TypeScript for compile-time type checking

**Styling Utilities**
- clsx & tailwind-merge: Class name management
- class-variance-authority: Component variant handling
- tw-animate-css: Animation utilities for Tailwind