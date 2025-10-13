# Initial Spec Idea

## User's Initial Description
We need to create a UserAuth manager for the churchfeed app that works across the backend (Convex) and frontend (Next.js). This manager will be used to check user authentication and authorization (user roles and feed permissions).

Key aspects:
- Authentication is handled by Clerk
- Multi-tenant application (organizations)
- User roles: Admin and User
- Feed roles: Feed Member and Feed Owner
- Feed permissions: Privacy (public/open/private) and Member permissions (post/message)
- Must work across frontend (Next.js) and backend (Convex)
- Should replace existing auth logic in app/hooks/useAuthedUser.ts and convex/user.ts

## Metadata
- Date Created: 2025-10-13
- Spec Name: user-auth-permissions
- Spec Path: agent-os/specs/2025-10-13-user-auth-permissions
