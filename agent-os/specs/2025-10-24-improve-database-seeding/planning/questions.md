# My Understanding of the Current Process

The current seeding process works like this:

1. **LLM generates JSON data:** An LLM (like Claude or GPT) is given the `prompt.txt` file, which describes the data structure and requirements.
2. **JSON file is saved:** The LLM creates a `seed-data-{org-name}-{date}.json` file with the generated data.
3. **Script reads JSON and seeds database:** The `seed.js` script:
   - Loads the JSON file
   - Connects to Convex using the HTTP client
   - Calls the `seedDatabase` mutation, which processes the data sequentially:
     - Creates organizations
     - Creates users (with basic auth setup)
     - Creates feeds
     - Creates user-feed relationships
     - Creates posts (currently in HTML format)
     - Creates messages (currently in HTML format)

Is this understanding correct?

**Answer**: Your understanding is correct. Please ensure that you reference this when deciding how the new flow should work.

# Clarifying Questions

1. **Image Upload Process**
   - Should the improved process still use an LLM to generate the JSON, but now include references to image files?
   - Or should we create a more automated process where the script itself handles uploading images to Convex storage?
   - For avatar images, should they be assigned to specific users in the JSON (e.g., `{ "email": "john@church.com", "name": "John", "avatar": "man4.jpg" }`)?
	**Answer**: The flow should work like this: 
	1. Images are manually dropped into the @scripts/seed/assets/avatars and @scripts/seed/assets/posts folder by me. I will ensure that each image has a proper description as its filename (for posts) or "man1.jpg", "woman3.jpg", etc. for avatars
	2. The LLM should use this data to create the `users` seed data. It should look like this: `{ "email": "john@church.com", "name": "John Johnson", "image": "man4.jpg" }`
	3. For posts, the format should look like this:
	```
	{ "content": {"type":"doc","content":[{"type":"paragraph"},{"type":"image","attrs":{"src":"PLACEHOLDER/church-basement-floor-progress.jpg","alt":null,"title":null,"width":null,"height":null}},{"type":"paragraph","content":[{"type":"text","text":"The current progress on the new church basement flooring."}]}]}, "feedIndex": 0, "userIndex": 0, images: ["church-basement-floor-progress.jpg"] }
	```
	4. When processing posts and users, the `seed.js` script should find the images in the above formats, then find the matching image in its containing folder, and upload it. 
	5. An imported post should have the Storage URL right in the TipTap content. An imported user should have an `uploads._id` set for their avatar.

2. **Image Storage in Posts/Messages**

   When images are embedded in posts/messages:
   - Should the JSON specify which image file to use (e.g., referencing the filename like `"youth-group-pizza.jpg"`)?
   - Or should the JSON just describe what type of image should be there, and we handle the selection separately?
   - **Answer**: Please look at my answer to question 1.
   - Looking at the TipTap JSON format with images, it needs a full Convex storage URL. Should the seeding process:
     1. Upload all images from `scripts/seed/assets/` to Convex storage first
     2. Get back the storage URLs
     3. Then use those URLs when constructing the TipTap JSON?
	**Answer**: As I described in my answer to question 1, the script should look for images in the generated seed JSON and upload just those images. 

3. **Feed Categories**

   The requirements specify five feed categories. Should the JSON generation prompt:
   - Require that _all five_ categories are represented?
   - Or just ensure there's a good mix of these types?
   - Should there be multiple feeds per category (e.g., 2–3 homegroup feeds)?
   **Answer**: There should be a good mix of these types, and it should be required that there are some public feeds (e.g. Announcements).

4. **Uploads Table**

   I see the schema has an `uploads` table that tracks:
   - `storageId` — reference to Convex `_storage`
   - `source` — whether it's for a post, message, or avatar
   - `sourceId` — optional reference to the specific post/message/user

   Should the seeding process:
   - Create entries in the `uploads` table for all seeded images?
   - **Answer**: yes
   - Link avatar uploads to their users via `sourceId`?
   - **Answer**: Don't worry about `sourceId`. But avatar uploads should be linked to their users via the `users.image` column, which accepts an `uploads._id`
   - For posts/messages with images, should we wait to set the `sourceId` until _after_ the post/message is created?
   - **Answer**: Don't worry about setting `sourceId`

5. **Existing Seed Data File**

   I see there's a `seed-data-thevine-2025-10-23.json` file in the git status as untracked. Should:
   - The improved process still follow the pattern of generating new dated JSON files?
   - Or should there be one canonical `seed-data.json` that gets updated?
   **Answer**: The process should still follow this pattern

6. **Scope**

   Should this improved seeding process:
   - Still generate only one organization (as specified in the current prompt)?
   - Or should it generate multiple organizations for better testing?
   **Answer**: It should still generate only one org. This is because of token limits from the LLM.
