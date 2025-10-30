#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../../convex/_generated/api");
const fs = require('fs');
const path = require('path');

// Get Convex URL from environment or use default
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL environment variable is required");
  console.error("Set it in your .env.local file or export it:");
  console.error("export CONVEX_URL=https://your-deployment.convex.cloud");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Load seed data from JSON file
function loadSeedData() {
  try {
    const dataPath = path.join(__dirname, 'seed-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error("❌ Failed to load seed data:", error.message);
    console.error("Make sure seed-data.json exists in the same directory as this script");
    process.exit(1);
  }
}

/**
 * Upload an image to Convex storage and create an upload record
 * @param {string} imagePath - Absolute path to the image file
 * @param {string} userId - User ID who owns this upload
 * @param {string} orgId - Organization ID
 * @param {string} source - Upload source: "avatar", "post", or "message"
 * @param {string} sourceId - Optional source ID (user/post/message ID)
 * @returns {Promise<{uploadId: string, url: string, storageId: string}>}
 */
async function uploadImageToConvex(imagePath, userId, orgId, source, sourceId = undefined) {
  // Read file from disk
  const fileBuffer = fs.readFileSync(imagePath);
  const fileName = path.basename(imagePath);
  const fileExtension = path.extname(imagePath).substring(1);

  // Get MIME type based on file extension
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'avif': 'image/avif'
  };
  const mimeType = mimeTypes[fileExtension.toLowerCase()] || 'application/octet-stream';

  // Convert buffer to base64 for transport
  const base64Data = fileBuffer.toString('base64');

  // Upload to Convex storage using action
  const storageId = await client.action(api.seed.storage.store, {
    fileData: base64Data,
    mimeType: mimeType
  });

  // Create upload record using action
  const uploadId = await client.action(api.seed.storage.createUploadRecord, {
    orgId,
    userId,
    storageId,
    source,
    sourceId,
    fileExtension
  });

  // Get storage URL using action
  const url = await client.action(api.seed.storage.getUrl, { storageId });

  return { uploadId, url, storageId };
}

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");
    console.log(`📡 Using Convex URL: ${CONVEX_URL}`);

    const seedData = loadSeedData();
    console.log(`📁 Loaded seed data for ${seedData.organizations.length} organizations`);

    // Process each organization to handle images before calling seedDatabase mutation
    for (const orgData of seedData.organizations) {
      console.log(`\n🏢 Processing organization: ${orgData.orgName}`);

      // Create organization first (we need the orgId for image uploads)
      const orgId = await client.mutation(api.seed.seed.seedOrganization, {
        name: orgData.orgName,
        location: orgData.orgLocation,
        host: orgData.orgHost,
      });
      console.log(`✅ Organization created: ${orgId}`);

      // Create users first (we need userIds for image uploads)
      console.log(`\n👥 Creating ${orgData.users.length} users...`);
      const userIds = [];
      for (const user of orgData.users) {
        const userId = await client.mutation(api.seed.seed.seedUser, {
          email: user.email,
          name: user.name,
          orgId: orgId,
        });
        userIds.push(userId);
      }
      console.log(`✅ Created ${userIds.length} users`);

      // Process avatars
      console.log(`\n📸 Processing avatars...`);
      let avatarCount = 0;
      for (let i = 0; i < orgData.users.length; i++) {
        const user = orgData.users[i];
        const userId = userIds[i];

        if (user.image) {
          const imagePath = path.join(__dirname, 'assets', 'avatars', user.image);
          if (fs.existsSync(imagePath)) {
            console.log(`  Uploading avatar for ${user.name}...`);
            try {
              const { uploadId } = await uploadImageToConvex(
                imagePath,
                userId,
                orgId,
                'avatar',
                userId
              );

              // Update user record with avatar
              await client.mutation(api.seed.seed.patchUserAvatar, {
                userId,
                imageUploadId: uploadId
              });
              avatarCount++;
            } catch (error) {
              console.log(`  ⚠️  Failed to upload avatar for ${user.name}: ${error.message}`);
            }
          } else {
            console.log(`  ⚠️  Image not found: ${user.image}`);
          }
        }
      }
      console.log(`✅ Uploaded ${avatarCount} avatars`);

      // Create feeds
      console.log(`\n📋 Creating ${orgData.feeds.length} feeds...`);
      const feedIds = [];
      for (const feed of orgData.feeds) {
        const feedId = await client.mutation(api.seed.seed.seedFeed, {
          orgId: orgId,
          name: feed.name,
          privacy: feed.privacy,
        });
        feedIds.push(feedId);
      }
      console.log(`✅ Created ${feedIds.length} feeds`);

      // Create userFeeds
      console.log(`\n🔗 Creating ${orgData.userFeeds.length} user-feed relationships...`);
      const userFeedIds = [];
      for (const userFeed of orgData.userFeeds) {
        if (userFeed.userIndex < userIds.length && userFeed.feedIndex < feedIds.length) {
          const userFeedId = await client.mutation(api.seed.seed.seedUserFeed, {
            orgId: orgId,
            userId: userIds[userFeed.userIndex],
            feedId: feedIds[userFeed.feedIndex],
            owner: userFeed.owner,
          });
          userFeedIds.push(userFeedId);
        }
      }
      console.log(`✅ Created ${userFeedIds.length} user-feed relationships`);

      // Process posts with images
      console.log(`\n🖼️  Processing post images...`);
      let postImageCount = 0;
      const processedPosts = [];

      for (let postIdx = 0; postIdx < orgData.posts.length; postIdx++) {
        const post = orgData.posts[postIdx];
        let processedContent = post.content;

        // Handle image uploads and placeholder replacement
        if (post.images && post.images.length > 0) {
          console.log(`  Uploading ${post.images.length} images for post...`);
          const imageUploads = [];

          for (const imageFilename of post.images) {
            const imagePath = path.join(__dirname, 'assets', 'posts', imageFilename);
            if (fs.existsSync(imagePath)) {
              try {
                const posterId = userIds[post.userIndex];
                const { url } = await uploadImageToConvex(
                  imagePath,
                  posterId,
                  orgId,
                  'post'
                  // Note: sourceId not set yet, will be post._id after creation
                );
                imageUploads.push({ filename: imageFilename, url });
                postImageCount++;
              } catch (error) {
                console.log(`  ⚠️  Failed to upload image ${imageFilename}: ${error.message}`);
              }
            } else {
              console.log(`  ⚠️  Image not found: ${imageFilename}`);
            }
          }

          // Replace PLACEHOLDER URLs in content with actual storage URLs
          if (imageUploads.length > 0) {
            let contentStr = JSON.stringify(processedContent);
            for (const { filename, url } of imageUploads) {
              contentStr = contentStr.replace(`PLACEHOLDER/${filename}`, url);
            }
            processedContent = JSON.parse(contentStr);
          }
        }

        // Ensure TipTap JSON content is stringified
        if (typeof processedContent === 'object') {
          processedContent = JSON.stringify(processedContent);
        }

        processedPosts.push({
          ...post,
          content: processedContent
        });
      }
      console.log(`✅ Uploaded ${postImageCount} post images`);

      // Create posts
      console.log(`\n📝 Creating ${processedPosts.length} posts...`);
      const postIds = [];
      for (const post of processedPosts) {
        if (post.feedIndex < feedIds.length && post.userIndex < userIds.length) {
          const postId = await client.mutation(api.seed.seed.seedPost, {
            orgId: orgId,
            feedId: feedIds[post.feedIndex],
            posterId: userIds[post.userIndex],
            content: post.content,
            postedAt: post.postedAt,
          });
          postIds.push(postId);
        }
      }
      console.log(`✅ Created ${postIds.length} posts`);

      // Process and create messages
      console.log(`\n💬 Creating ${orgData.messages.length} messages...`);
      const messageIds = [];
      for (const message of orgData.messages) {
        if (message.postIndex < postIds.length && message.userIndex < userIds.length) {
          // Ensure message content is stringified if it's an object
          let messageContent = message.content;
          if (typeof messageContent === 'object') {
            messageContent = JSON.stringify(messageContent);
          }

          const messageId = await client.mutation(api.seed.seed.seedMessage, {
            orgId: orgId,
            postId: postIds[message.postIndex],
            senderId: userIds[message.userIndex],
            content: messageContent,
          });
          messageIds.push(messageId);
        }
      }
      console.log(`✅ Created ${messageIds.length} messages`);

      console.log(`\n✅ Organization "${orgData.orgName}" seeding complete!`);
      console.log(`📊 Summary:`);
      console.log(`  - Users: ${userIds.length}`);
      console.log(`  - Avatars: ${avatarCount}`);
      console.log(`  - Feeds: ${feedIds.length}`);
      console.log(`  - User-Feed Relationships: ${userFeedIds.length}`);
      console.log(`  - Posts: ${postIds.length}`);
      console.log(`  - Post Images: ${postImageCount}`);
      console.log(`  - Messages: ${messageIds.length}`);
    }

    console.log("\n✅ Database seeded successfully!");

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    if (error.data) {
      console.error("Error details:", error.data);
    }
    process.exit(1);
  }
}

async function clearDatabase() {
  try {
    console.log("🗑️  Clearing database...");

    // Note: Convex doesn't have a built-in way to clear all data
    // You would need to create specific clear mutations if needed
    console.log("⚠️  Clear functionality not implemented yet.");
    console.log("   You can manually delete data from the Convex dashboard");

  } catch (error) {
    console.error("❌ Clear failed:", error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];

if (command === "clear") {
  clearDatabase();
} else if (command === "seed" || !command) {
  seedDatabase();
} else {
  console.log("Usage:");
  console.log("  npm run seed       - Seed the database");
  console.log("  npm run seed clear - Clear the database");
  process.exit(1);
}
