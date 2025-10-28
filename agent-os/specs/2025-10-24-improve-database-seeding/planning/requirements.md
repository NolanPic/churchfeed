# Requirements

We need to improve the database seeding process. The current process is available in @/scripts/seed, and right now it can be used to generate and insert text content into the database.

The improvements we want to make:

- Images should be included in the content, both for user avatars and embedded within posts (and possibly messages)
- Make the content itself feel more real. Right now, it sounds either: 1) too Christianese, or 2) too much like marketing content. It should seem more like a community of people having conversations. There should be a mix of both "official" church communication (e.g. announcements, sermons, etc.) as well as 
- Instead of being HTML, the post and message content needs to be in TipTap's JSON format
- Create a README for the @scripts/seed directory with clear steps on how to seed

Below is more detail on how to do each.

## Images
We want to be able to control what images are used. There should be some sort of folder structure to put source images. For example:

- @scripts/seed/assets/avatars - holds avatars with names like `woman1.jpg` and `man4.jpg`
- @scripts/seed/assets/posts - hold images with detailed descriptions as file names

 These images should then be referenced in the @scripts/seed/prompt.txt so that an LLM can choose where to use the images/generate content based on the detailed file names/etc.

The images, as part of the seeding process, will need to be uploaded to Convex storage and tracked in the `uploads` table.

## Content quality
The quality of content that is generated needs to improve and sound more like real people.

As a part of this, the LLM should be directed to create feeds that fit into these categories:

1. Homegroup feeds - e.g. "Davidson homegroup", "Klesick homegroup", etc. These feeds should be private
2. Official "Announcements", "Events", or "Resources" feeds that church leaders post in - should be public feeds
3. Book Clubs - e.g. "Andy & Lisa's book club", "The Anxious Generation book club", etc., can be a mix of open and private feeds
4. Bible study groups - e.g. "Philippians men's study", "Ecclesiastes women's study", "Psalms study" - should be open feeds
5. Ministry/volunteer feeds like "Food drive", "Grounds maintenance", "Coffee setup"

The examples given are just examples, but there should definitely be feeds generated that fit into these categories. The above categories should help with improving the quality of the content.

## Content format
We switched from storing post and message content as HTML to storing it as TipTap JSON in the database (TipTap is our editor). Here's an example of what it looks like:

```json
{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"The dino buddies staged an attack in the kid's wing. The dino buddies did not anticipate the carnage to be wrecked on their species by the 5s-and-under. Ketchup is everywhere..."}]}]}
```

Here's an example with an image:

```json
{"type":"doc","content":[{"type":"paragraph"},{"type":"image","attrs":{"src":"https://judicious-clam-648.convex.cloud/api/storage/04bc3f1b-b7d2-447a-9bc8-5a67b52027d7","alt":null,"title":null,"width":null,"height":null}},{"type":"paragraph","content":[{"type":"text","text":"Halls of Manwë"}]}]}
```

## README
The readme should allow any dev on the team to walk through the steps to seed the database. It should also include steps for deleting existing data/tables in the Convex dashboard before beginning.

This task should be done last, because the instructions will be based on the improvements above.

## Very important note!!!
You need to understand the current seeding process before you make any decisions on how the new process will work. The new process should not majorly change the existing process, but just improve it. When you begin asking questions about these requirements, as one of your questions you should summarize your understanding of how the process currently works, and ask me if it's correct.