# churchfeed Product Roadmap

## Current State

churchfeed is in active development with some major features such as multi-tenancy, feeds, posting, and messaging complete. We are on the path to closed beta (Q4 2025).

## Phase 1: Path to Closed Beta

The following features are required before closed beta launch:

### Organization

- [x] Each org has their own domain, e.g. kingscross.thechurchfeed.com
- [ ] Each org can use their own logo

### Feed Screen

- [x] Organization name and location is displayed at top
- [x] Logged out users can view public feed
- [x] Logged in users can view public feed + other feeds they are members of
- [x] Feed selector toggles between specific or all feeds
- [x] Scrolling to bottom of feed loads more posts
- [x] Display avatars

### Auth & Onboarding

- [x] Log in with email [Authentication: log in with email](https://github.com/NolanPic/churchfeed/issues/34)
- [ ] Invites [Invites](https://github.com/NolanPic/churchfeed/issues/35)
  - [ ] Email invites
  - [ ] Link invites (e.g. for QR codes)
  - [ ] Approval flow for link-based registrations (by default links require approval after user registers, but this can be toggled)

### Posting

- [x] Implement [TipTap](https://tiptap.dev/)
- [ ] Text area supports:
  - [x] Text (bold/italic/links)
  - [x] Images (possibly single image for now if multiple is too complex)
  - [ ] iframe embeds (for video, audio, etc.)
    - [ ] Limited to specific hosts
- [x] User can choose which feed to post in
- [ ] Owner can delete post

### Messages

- [x] Users can open a post and chat
- [x] Newest messages are at the bottom
- [x] Messages support text/images/mentions(later)
- [ ] Owner can delete message

### Feeds

- [x] Public (anyone can view w/o login)
- [x] Private (no one can see it exists w/o being given access by admin)
- [ ] Browse and join open feeds
- [x] Read-only (feed members can only read contents, feed owners can post)

### User Profile/Settings

- [x] Avatar on top right allows user to go to profile, log out
- [ ] User can change:
  - [ ] Name
  - [ ] Email (→ later, this can be a support request for now)
  - [ ] Avatar

### Notifications

- [ ] User is notified of messages in posts that they created
- [ ] User is notified of messages in posts that they have messaged in
- [ ] User is notified of new posts in feeds that they are a member of and have chosen to be notified (if a feed owner, this will be on by default)
- [ ] User is notified when mentioned in a post or comment (→ later once mentions are implemented)
- [ ] Feed owner is notified of member joining their feed
- [ ] Admin is notified of new user that needs to be approved

### Admin

- [ ] Able to delete any post or comment
- [ ] Able to manage users in a list
  - [ ] Invite
  - [ ] Approve users invited through link/QR code
  - [ ] Deactivate
  - [ ] Change role
- [ ] Able to manage feeds
  - [ ] Create
  - [ ] Delete
  - [ ] Make public/private/open
  - [ ] Able to see private feeds created by others and manage membership
- [ ] Able to assign users to feeds (can assign user to feed(s) when inviting)

### Feed Owners

- [ ] Able to delete any post or comment in feed they own
- [ ] Able to invite existing users to feed
- [ ] Able to invite new users to feed (when admin setting allows)

### Image/file improvements

- [x] Simplify image uploading on frontend
- [x] Store all uploads across the app in a permissions-based table

---

## Phase 2: Path to 1.0

### Beta Feedback

- [ ] Address beta feedback

### Church Registration

- [ ] Self-Service Registration Flow
  - [ ] Church registration form
  - [ ] Subdomain selection and validation
  - [ ] Initial setup wizard
  - [ ] First admin account creation

### Subscriptions

- [ ] Creating billing process
  - [ ] Integrate Stripe with backend
  - [ ] Build out frontend

### Organization Setup (?)

- [ ] Enhanced Organization Profile
  - [ ] Church website link
  - [ ] Service times and location details
  - [ ] About/description text
  - [ ] Social media links

---

## Phase 3: Stability, Accessibility

### Stability

- [ ] Codebase improvements for better building blocks

### Accessibility

- [ ] WCAG Compliance
  - [ ] Keyboard navigation
  - [ ] Screen reader optimization
  - [ ] High contrast mode
  - [ ] Accessible color palette

---

## Success Criteria

### Closed Beta Launch Criteria

- All Phase 1 features completed
- 2- 5 pilot churches successfully onboarded

### V1.0 Launch Criteria

- All Phase 2 features completed
- Security audit passed
- Performance benchmarks met (< 1.5s page load)
- Advertise on challies.com
- Advertise on podcasts
- < 5 critical bugs in production

### Future ideas

- @mentions
- Event posting
- Sermon integration/posting
- RSVPing
- File attachments
- Image galleries
