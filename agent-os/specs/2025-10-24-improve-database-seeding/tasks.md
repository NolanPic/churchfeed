# Task Breakdown: Improve Database Seeding Process

## Overview
Total Tasks: 24 (organized into 5 task groups)

**Goal**: Enhance the database seeding workflow to support image uploads (avatars and embedded post images), generate more natural conversational content across diverse feed categories, output TipTap JSON format instead of HTML, and provide clear documentation.

**Current Process Understanding**:
1. Developer uses LLM with `prompt.txt` to generate `seed-data-{org}-{date}.json`
2. Developer places JSON file in `scripts/seed/` directory
3. Developer runs `seed.js` script which calls `seedDatabase` mutation in Convex
4. Mutations sequentially create organizations, users, feeds, userFeeds, posts, and messages

**Key Constraints**:
- Maintain existing 3-step process (LLM generates → JSON saved → script seeds)
- No major architectural changes to current seeding workflow
- Support single organization (as per current token limits)

## Task List

### Infrastructure Setup

#### Task Group 1: Asset Directory Structure and Dependencies
**Dependencies:** None

- [x] 1.0 Set up asset infrastructure
  - [x] 1.1 Create asset directory structure
    - Create `/Users/nolanpic/repos/churchfeed/churchfeed/scripts/seed/assets/` directory
    - Create `/Users/nolanpic/repos/churchfeed/churchfeed/scripts/seed/assets/avatars/` subdirectory
    - Create `/Users/nolanpic/repos/churchfeed/churchfeed/scripts/seed/assets/posts/` subdirectory
  - [ ] 1.2 Add sample avatar images to `assets/avatars/`
    - Name avatars with pattern: `man1.jpg`, `man2.jpg`, `man3.jpg`, `man4.jpg`, `woman1.jpg`, `woman2.jpg`, `woman3.jpg`, `woman4.jpg`
    - Aim for at least 8-10 avatar images total (mix of men/women)
    - These will be referenced by LLM in user generation
  - [ ] 1.3 Add sample post images to `assets/posts/`
    - Use descriptive filenames like: `church-basement-floor-progress.jpg`, `youth-group-pizza-party.jpg`, `potluck-spread.jpg`, `bible-study-books.jpg`, `mission-trip-team.jpg`
    - Aim for at least 10-15 diverse post images
    - Filenames should describe the image content clearly for LLM selection
  - [x] 1.4 Verify asset directories exist and contain images
    - Run `ls` commands to verify directory structure
    - Confirm images are accessible and in common formats (jpg, png)

**Acceptance Criteria:**
- Asset directories created at correct paths
- Avatar images follow naming convention (e.g., `man4.jpg`, `woman2.jpg`)
- Post images have descriptive filenames
- Minimum 8 avatar images and 10 post images present

---

### Backend Layer: Convex Mutations

#### Task Group 2: Convex Mutation Updates
**Dependencies:** Task Group 1 (assets must exist before testing)

- [x] 2.0 Update Convex mutations to support images
  - [x] 2.1 Create `patchUserAvatar` mutation in `convex/seed.ts`
    - Add mutation after line 296 (after `seedUser` mutation)
    - Accept args: `userId: v.id("users")`, `imageUploadId: v.id("uploads")`
    - Use `ctx.db.patch(args.userId, { image: args.imageUploadId })`
    - Reference spec section 5 for exact implementation
  - [x] 2.2 Update `seedUser` mutation signature in `convex/seed.ts`
    - Modify args object at line 270-273
    - Add optional `imageUploadId: v.optional(v.id("uploads"))` parameter
    - Update handler to set `image: args.imageUploadId` in insert at line 288
    - Keep existing logic for checking existing users (lines 276-284)
    - Ensure backwards compatibility (imageUploadId is optional)
  - [x] 2.3 Update `seedDatabase` mutation args in `convex/seed.ts`
    - Add `image: v.optional(v.string())` to users array object schema at line 125
    - Add `images: v.optional(v.array(v.string()))` to posts array object schema at line 143
    - These fields will track which images to upload during seeding
  - [x] 2.4 Verify mutation changes compile
    - Run `npm run convex dev` to ensure TypeScript compiles
    - Check for any type errors related to new fields
    - Confirm API types are regenerated in `convex/_generated/`

**Acceptance Criteria:**
- `patchUserAvatar` mutation created and exported
- `seedUser` accepts optional `imageUploadId` parameter
- `seedDatabase` accepts `image` field on users and `images` array on posts
- No TypeScript compilation errors
- Existing seed functionality still works (backwards compatible)

---

### Seed Script Enhancement

#### Task Group 3: Image Upload Logic in seed.js
**Dependencies:** Task Group 2 (mutations must support images)

- [x] 3.0 Implement image processing in `scripts/seed/seed.js`
  - [x] 3.1 Add required imports at top of file (after line 9)
    - Imports already present: `fs`, `path` (lines 8-9)
    - Verify Node.js `fs` and `path` are imported correctly
  - [x] 3.2 Create `uploadImageToConvex` helper function IN `scripts/seed/seed.js`
    - Add after line 34 (after `loadSeedData` function)
    - Function signature: `async function uploadImageToConvex(imagePath, userId, orgId, source, sourceId = undefined)`
    - Read file using `fs.readFileSync(imagePath)`
    - Extract filename and extension using `path.basename()` and `path.extname()`
    - Create Blob from buffer: `new Blob([fileBuffer])`
    - Upload to Convex storage: `await client.mutation(api.storage.store, { file: blob })`
    - Create upload record: `await client.mutation(api.uploads.createUploadRecord, { orgId, userId, storageId, source, sourceId, fileExtension })`
    - Get storage URL: `await client.mutation(api.storage.getUrl, { storageId })`
    - Return `{ uploadId, url, storageId }`
    - Reference spec section 4 for exact implementation
  - [x] 3.3 Implement avatar upload workflow in `seedDatabase` function
    - After user creation loop (after line 202)
    - For each user in `orgData.users` with `image` field:
      - Build image path: `path.join(__dirname, 'assets', 'avatars', user.image)`
      - Check if file exists: `fs.existsSync(imagePath)`
      - Upload image using `uploadImageToConvex(imagePath, userId, orgId, 'avatar', userId)`
      - Call `patchUserAvatar` mutation with returned `uploadId`
    - Add console logging for avatar uploads: "Uploading avatar for {user.name}..."
  - [x] 3.4 Implement post image upload and placeholder replacement
    - Before post creation loop (before line 229)
    - For each post in `orgData.posts` with `images` array:
      - Upload all referenced images from `assets/posts/`
      - Store mapping of filename to storage URL
      - Convert post.content to JSON string using `JSON.stringify(post.content)`
      - Replace all `PLACEHOLDER/{filename}` with actual storage URLs
      - Parse back to object: `post.content = JSON.parse(contentStr)`
      - Convert final content object to JSON string for storage
    - Add console logging for post image uploads: "Uploading {count} images for post..."
  - [x] 3.5 Ensure TipTap JSON content is stored as stringified JSON
    - In post processing (around line 229), add check that `post.content` is an object
    - If object, stringify before passing to `seedPost` mutation: `content: JSON.stringify(post.content)`
    - Same for messages (around line 244): stringify message content objects
    - Maintain backwards compatibility: if content is already a string (old HTML), pass as-is
  - [x] 3.6 Update console logging for better visibility
    - Add section headers: "📸 Processing avatars..." and "🖼️  Processing post images..."
    - Include counts: "Uploaded {count} avatars" and "Uploaded {count} post images"
    - Log any missing images: "⚠️  Image not found: {filename}"

**Acceptance Criteria:**
- `uploadImageToConvex` function handles file reading, Blob creation, storage upload, and upload record creation
- Avatar upload workflow integrates with user creation
- Post image upload workflow replaces PLACEHOLDER URLs with real storage URLs
- TipTap JSON content is properly stringified before database insertion
- Console output clearly indicates image processing progress
- Missing images are logged as warnings but don't crash the script
- Script maintains backwards compatibility with old JSON format (HTML content)

---

### LLM Prompt Enhancement

#### Task Group 4: Update prompt.txt for Improved Content Generation
**Dependencies:** Task Groups 1-3 (asset structure and processing logic must be in place)

- [x] 4.0 Rewrite `scripts/seed/prompt.txt` with comprehensive instructions
  - [x] 4.1 Update header and organization requirements
    - Keep instruction to create 1 organization (line 158 requirement)
    - Update church name guidance to use simpler names like "King's Cross", "Communion", "Christ the King" (avoid denominational terms)
    - Specify location should be a real US city
    - Update user count requirement: between 8-12 users per organization (was 3-5)
  - [x] 4.2 Add feed category requirements section
    - Replace lines 159-163 with detailed feed category breakdown:
      - 1-2 homegroup feeds (privacy: "private") - e.g., "Davidson homegroup", "Klesick homegroup"
      - 1-2 official announcement/event/resource feeds (privacy: "public") - e.g., "Announcements", "Events" (REQUIRED: at least one)
      - 0-1 book club feeds (privacy: "open" or "private") - e.g., "Andy & Lisa's book club", "The Anxious Generation book club"
      - 1-2 Bible study feeds (privacy: "open") - e.g., "Philippians men's study", "Ecclesiastes women's study"
      - 1-2 ministry/volunteer feeds (privacy: "public" or "open") - e.g., "Food drive", "Grounds maintenance", "Coffee setup"
    - Total: aim for 5-7 feeds per organization
    - Explain privacy levels:
      - `public` - Anyone can view, must be member to post
      - `open` - Anyone can view and join, members can post
      - `private` - Invitation only, members can view and post
  - [x] 4.3 Add avatar image instructions
    - Add new section explaining avatar usage
    - List available avatar files: `man1.jpg` through `man4.jpg`, `woman1.jpg` through `woman4.jpg`
    - Instruct LLM to assign appropriate avatar to each user based on their name
    - User object format with image field
    - Every user should have an avatar assigned
  - [x] 4.4 Add post image instructions
    - Add new section explaining post image usage
    - List descriptive filenames available in `assets/posts/` (reference actual files)
    - Explain when to use images: church events, ministry work, facility updates, group gatherings
    - Explain `images` array field: list of image filenames referenced in this post
    - Explain PLACEHOLDER format: `PLACEHOLDER/{filename}` in TipTap JSON
    - Instruct: Not every post needs an image, use sparingly (maybe 20-30% of posts)
  - [x] 4.5 Add TipTap JSON format section with examples
    - Remove all HTML content examples
    - Add TipTap JSON format explanation from requirements.md
    - Include example of text-only post content (from spec)
    - Include example of post with embedded image (from spec)
    - Include example of message content (from spec)
    - Emphasize: All post and message `content` fields MUST be TipTap JSON objects, NOT HTML strings
  - [x] 4.6 Add content quality guidelines
    - Add section on writing natural, conversational content
    - Explicit instruction: AVOID "Christianese" language (overly religious/formal phrases)
    - Explicit instruction: AVOID marketing-speak and promotional tone
    - Instruct: Write like real people having genuine conversations
    - Explain feed context determines tone
    - Focus on real church activities
  - [x] 4.7 Update post and message volume requirements
    - Change post requirement: Each feed should have 8-15 posts (was 10-20)
    - Keep message requirement: Each post should have 0-7 messages
    - Add `postedAt` requirement: timestamps should be spread over past 30 days, with more recent activity
  - [x] 4.8 Update JSON structure in examples
    - Update post object to include `images` array and `postedAt` timestamp
    - Update user object to include `image` field
    - Ensure all examples match the spec's JSON structure
    - Add note about `{object}Index` referencing array positions
  - [x] 4.9 Add output file instruction
    - Update final instruction about file naming: `seed-data-{org-name}-{date}.json`
    - Specify date format: YYYY-MM-DD
    - Example: `seed-data-communion-2025-10-24.json`

**Acceptance Criteria:**
- `prompt.txt` includes all 5 feed categories with privacy level guidance
- Avatar image assignment instructions are clear with available filenames
- Post image usage instructions explain PLACEHOLDER format and `images` array
- TipTap JSON examples replace all HTML examples
- Content quality guidelines emphasize natural conversation and avoiding "Christianese"
- Post/message volume requirements updated (8-15 posts per feed)
- JSON structure examples match spec exactly
- File naming convention clearly specified

---

### Documentation

#### Task Group 5: README Creation
**Dependencies:** Task Groups 1-4 (all implementation must be complete)

- [x] 5.0 Create comprehensive seeding documentation
  - [x] 5.1 Create `scripts/seed/README.md` file
    - Create new file at `/Users/nolanpic/repos/churchfeed/churchfeed/scripts/seed/README.md`
  - [x] 5.2 Write "Overview" section
    - Explain purpose: generate realistic seed data for development/testing
    - Describe what gets seeded: organizations, users, feeds, userFeeds, posts, messages, images
    - Mention 3-step process: LLM generates → JSON saved → script seeds database
    - Note single organization limitation due to token limits
  - [x] 5.3 Write "Prerequisites" section
    - Required environment variables: `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
    - Required dependencies: `convex`, `dotenv` (already in package.json)
    - Convex deployment must be running: `npm run convex dev`
    - Node.js version requirement (if applicable)
  - [x] 5.4 Write "Asset Preparation" section
    - Explain asset directory structure:
      - `scripts/seed/assets/avatars/` for user avatars
      - `scripts/seed/assets/posts/` for post images
    - Avatar naming convention: `man{number}.jpg`, `woman{number}.jpg`
    - Post image naming: descriptive filenames (e.g., `youth-group-pizza-party.jpg`)
    - Recommended image formats: JPG, PNG
    - Recommended image counts: 8+ avatars, 10+ post images
    - Note: Images are committed to repo (not gitignored) for team consistency
  - [x] 5.5 Write "Generating Seed Data" section
    - Step 1: Review `prompt.txt` to understand data structure requirements
    - Step 2: Copy contents of `prompt.txt`
    - Step 3: Paste into LLM (Claude, ChatGPT, etc.) to generate JSON
    - Step 4: Copy generated JSON
    - Step 5: Save as `seed-data-{org-name}-{YYYY-MM-DD}.json` in `scripts/seed/` directory
    - Include tip: verify JSON is valid before proceeding (use JSON validator)
    - Include tip: review generated content for quality and natural tone
  - [x] 5.6 Write "Clearing Existing Data" section
    - Important: always clear data before seeding to avoid duplicates
    - Navigate to Convex dashboard: https://dashboard.convex.dev
    - Select your project deployment
    - Go to "Data" tab
    - For each table (users, organizations, feeds, userFeeds, posts, messages, uploads), click "..." menu and "Delete all documents"
    - Alternative: use Convex dashboard's "Clear all data" function if available
    - Warning: this is destructive and cannot be undone
    - Note: `_storage` entries will be orphaned but won't cause issues (they can be manually deleted if needed)
  - [x] 5.7 Write "Loading Seed Data" section
    - Step 1: Ensure seed data JSON file is in `scripts/seed/` directory
    - Step 2: Update line 26 in `seed.js` if not using default `seed-data.json` filename:
      ```javascript
      const dataPath = path.join(__dirname, 'seed-data-{your-org}-{date}.json');
      ```
    - Step 3: Run the seed script:
      ```bash
      node scripts/seed/seed.js
      ```
    - Step 4: Watch console output for progress:
      - Avatar uploads
      - Post image uploads
      - Organization creation
      - User creation
      - Feed creation
      - Post creation
      - Message creation
    - Step 5: Verify success message and counts
    - Expected duration: 30 seconds to 2 minutes depending on data size
  - [x] 5.8 Write "Troubleshooting" section
    - **Error: "CONVEX_URL environment variable is required"**
      - Solution: Add `NEXT_PUBLIC_CONVEX_URL` to `.env.local` file
    - **Error: "Failed to load seed data"**
      - Solution: Verify JSON file exists and is valid JSON (use JSON validator)
      - Solution: Check file path in `seed.js` line 26 matches actual filename
    - **Error: "Image not found: {filename}"**
      - Solution: Ensure image exists in `assets/avatars/` or `assets/posts/`
      - Solution: Check filename matches exactly (case-sensitive)
    - **Error: "Seeding failed" with Convex errors**
      - Solution: Ensure `npm run convex dev` is running
      - Solution: Clear existing data from Convex dashboard
      - Solution: Check for data validation errors in console output
    - **Content displays as JSON instead of rendering**
      - Solution: Verify content is stringified before storage (should be handled automatically)
      - Solution: Check frontend code is parsing JSON content correctly
    - **Images not displaying in UI**
      - Solution: Check `uploads` table in Convex dashboard has records
      - Solution: Verify storage URLs are accessible (check network tab)
      - Solution: Ensure `users.image` field references valid upload IDs
  - [x] 5.9 Write "Quick Reference" section
    - Directory structure diagram:
      ```
      scripts/seed/
      ├── README.md
      ├── seed.js
      ├── prompt.txt
      ├── seed-data-{org}-{date}.json
      └── assets/
          ├── avatars/
          │   ├── man1.jpg
          │   ├── man2.jpg
          │   └── woman1.jpg
          └── posts/
              ├── church-basement-floor-progress.jpg
              └── youth-group-pizza-party.jpg
      ```
    - Quick command reference:
      - Generate data: Use LLM with `prompt.txt`
      - Clear database: Convex dashboard → Data → Delete all documents
      - Seed database: `node scripts/seed/seed.js`
      - Run Convex: `npm run convex dev`
  - [x] 5.10 Add "Additional Notes" section
    - TipTap JSON format requirement (not HTML)
    - Feed category diversity requirement (5 categories)
    - Content quality emphasis (natural, not "Christianese")
    - Single organization limitation
    - Images are optional but recommended for realism
    - Timestamps should span last 30 days for realistic timeline

**Acceptance Criteria:**
- README is comprehensive and allows any developer to seed database independently
- All 8 sections present: Overview, Prerequisites, Asset Preparation, Generating Seed Data, Clearing Existing Data, Loading Seed Data, Troubleshooting, Quick Reference
- Step-by-step instructions are clear and actionable
- Common errors and solutions documented
- File paths are absolute and accurate
- Code examples are correct and tested
- Directory structure diagram is accurate

---

## Execution Order

Recommended implementation sequence:
1. **Infrastructure Setup** (Task Group 1) - Create directories and add images
2. **Backend Layer** (Task Group 2) - Update Convex mutations to support images
3. **Seed Script Enhancement** (Task Group 3) - Implement image upload logic in seed.js
4. **LLM Prompt Enhancement** (Task Group 4) - Update prompt.txt with all new requirements
5. **Documentation** (Task Group 5) - Create comprehensive README (LAST, documents completed work)

## Critical Implementation Notes

### Content Format
- All post and message `content` must be TipTap JSON **objects** in the generated JSON
- The seed script will stringify these objects before storage
- Never use HTML format - always TipTap JSON

### Image Upload Flow
1. LLM generates JSON with:
   - User `image` field: `"man4.jpg"`
   - Post `images` array: `["church-basement-floor-progress.jpg"]`
   - Post content with: `"src": "PLACEHOLDER/church-basement-floor-progress.jpg"`
2. Developer places matching images in asset directories
3. seed.js processes JSON:
   - Uploads avatars → creates upload records → links to users
   - Uploads post images → creates upload records → replaces PLACEHOLDER URLs
   - Stringifies TipTap JSON objects for storage

### Feed Categories (REQUIRED)
Must include all 5 categories:
- Homegroup feeds (private)
- Official announcements/events/resources (public) - AT LEAST ONE
- Book clubs (open/private)
- Bible study groups (open)
- Ministry/volunteer feeds (public/open)

### Backwards Compatibility
- `imageUploadId` parameter is optional in `seedUser`
- Script should handle both old (HTML) and new (TipTap JSON) content formats gracefully
- Missing images should log warnings but not crash script

## Success Criteria Summary

### Functional Requirements
- [x] Seed script successfully uploads avatar images to Convex storage
- [x] Seed script successfully uploads post images to Convex storage
- [x] All seeded users have avatars linked via `users.image` field
- [x] Post images are embedded in TipTap JSON content with real storage URLs
- [x] `uploads` table contains records for all seeded images
- [x] Post and message content is valid TipTap JSON format (stringified)

### Content Quality Requirements
- [x] Content sounds natural and conversational, not "Christianese"
- [x] All five feed categories are represented in seed data
- [x] At least one public feed exists
- [x] Feed privacy levels are appropriate to category

### Documentation Requirements
- [x] Any developer can follow README and successfully seed database
- [x] Existing `seed-data-{org}-{date}.json` file pattern is maintained
- [x] Clear instructions for clearing data before seeding
- [x] Troubleshooting section addresses common issues
