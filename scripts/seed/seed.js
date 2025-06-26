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

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");
    console.log(`📡 Using Convex URL: ${CONVEX_URL}`);
    
    const seedData = loadSeedData();
    console.log(`📁 Loaded seed data for ${seedData.organizations.length} organizations`);
    
    const result = await client.mutation(api.seed.seedDatabase, seedData);
    
    console.log("✅ Database seeded successfully!");
    console.log("📊 Results:");
    console.log(`  - Organizations: ${result.organizations.length} created`);
    console.log(`  - Total Users: ${result.totalUsers} created`);
    console.log(`  - Total Feeds: ${result.totalFeeds} created`);
    console.log(`  - Total User-Feed Relationships: ${result.totalUserFeeds} created`);
    console.log(`  - Total Posts: ${result.totalPosts} created`);
    console.log(`  - Total Messages: ${result.totalMessages} created`);
    
    console.log("\n📋 Organization Details:");
    result.organizations.forEach((org, index) => {
      console.log(`  ${index + 1}. ${org.orgName}`);
      console.log(`     - Users: ${org.userIds.length}`);
      console.log(`     - Feeds: ${org.feedIds.length}`);
      console.log(`     - User-Feed Relationships: ${org.userFeedIds.length}`);
      console.log(`     - Posts: ${org.postIds.length}`);
      console.log(`     - Messages: ${org.messageIds.length}`);
    });
    
    return result;
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