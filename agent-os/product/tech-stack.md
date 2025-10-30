# churchfeed Tech Stack

## Frontend

### Framework & Core

- Next.js
- TypeScript

### Styling

- CSS Modules
- PostCSS with the following plugins:
  - `postcss-preset-env` - Future CSS features today
  - `postcss-custom-media` - Custom media queries
  - `postcss-flexbugs-fixes` - Cross-browser flex consistency

### Rich Text Editor

- TipTap - Headless rich text editor built on ProseMirror
  - Extensions: Image, Placeholder, Starter Kit
  - React integration with `@tiptap/react`
  - Static rendering with `@tiptap/static-renderer`

### UI Components & Utilities

- Motion - Declarative animations
- Floating UI - element anchoring
- React Dropzone - File uploads
- DOMPurify - XSS protection for user content
- classnames - Conditional CSS classes
- usehooks-ts - TypeScript-first React hooks

---

## Backend

### Database & Backend Platform

- Convex - Serverless backend platform providing:
  - Real-time reactive database
  - Code-based schema
  - Type-safe queries and mutations
  - File storage
  - Authentication integration
  - Automatic API generation
- Multi-tenant schema with organization isolation

---

## Authentication & Security

### Auth Provider

- Clerk
  - Email/password authentication
  - Session handling
  - Note: Clerk is not the source of truth for our users. We store our users in Convex, and store a matching user in Clerk. The user logs in with Clerk, and we match it up with the user in our database (source of truth)

---

## Development Tools

### Build & Development

- Caddy - Local HTTPS server (development only)
  - Automatic SSL certificate generation
  - Local DNS setup for subdomain testing
  - Reverse proxy configuration

### Testing

- Vitest
- @testing-library/react
- Playwright

### Component Development

- Storybook
  - `@storybook/nextjs-vite` - Next.js integration
  - `@storybook/addon-a11y` - Accessibility testing
  - `@storybook/addon-docs` - Auto-generated documentation
  - `@storybook/addon-vitest` - Test integration

### Code Quality

- ESLint
  - Next.js config
  - Storybook plugin
- TypeScript

---

## DevOps & Infrastructure

### Version Control & CI/CD

- Git
- GitHub
- GitHub Desktop

### Local Development Setup

- Custom setup scripts:
  - `setup:certs` - SSL certificate generation
  - `setup:dns` - Local DNS configuration
  - `setup:caddy` - Reverse proxy setup
- Environment-based configuration (.env.local)

### Deployment

- Vercel (Next.js app + static assets)
- Convex cloud (backend/database + user assets)
- Custom domain management for multi-tenant subdomains

---

## Data Seeding & Development

- Custom seed scripts for local development
- Sample data generation

---

## Package Management

- npm

---

## Environment Configuration

### Development

- Local HTTPS with Caddy
- Subdomain simulation (e.g., dokimazo.churchfeed.dev)
- Hot module replacement
- Environment variables via `.env.local`

### Environment Variables

- `CONVEX_DEPLOYMENT` - Convex backend deployment ID
- `NEXT_PUBLIC_CONVEX_URL` - Public Convex API endpoint
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk server key
- `HOST` - Base domain for organization subdomains
- `NODE_ENV` - Environment mode

---

## Architecture Decisions

### Why Convex?

- Real-time data synchronization out of the box
- Type-safe queries that integrate with TypeScript
- Schema-as-code
- Simplified backend development with serverless functions
- Built-in file storage
- Excellent DX with local development tools

### Why Next.js?

- App router for improved routing and layouts
- Server components for better performance
- Streaming for progressive page loading
- Built-in optimization for images and fonts

### Why Clerk?

- Easy integration with Convex
- Don't have to ship auth ourselves
- Great DX
- Generous free tier
