#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../../convex/_generated/api");

// Get Convex URL from environment or use default
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL environment variable is required");
  console.error("Set it in your .env.local file or export it:");
  console.error("export CONVEX_URL=https://your-deployment.convex.cloud");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function setDemoOrganization() {
  try {
    console.log("🎭 Setting up demo organization...");
    console.log(`📡 Using Convex URL: ${CONVEX_URL}`);
    
    // Get the Dokimazo organization (first one in seed data)
    const org = await client.query(api.organizations.getOrganizationBySubdomain, {
      subdomain: "dokimazo"
    });
    
    if (!org) {
      console.error("❌ Dokimazo organization not found. Make sure to run seeding first.");
      process.exit(1);
    }
    
    console.log(`📋 Found organization: ${org.name} (${org.host})`);
    
    // Update the organization with demo settings
    await client.mutation(api.organizations.updateOrganizationSettings, {
      orgId: org._id,
      settings: {
        demo: true
      }
    });
    
    console.log("✅ Successfully set Dokimazo as a demo organization!");
    console.log("🎉 The demo modal will now appear when visiting dokimazo.churchfeed.dev");
    
  } catch (error) {
    console.error("❌ Setting demo organization failed:", error.message);
    if (error.data) {
      console.error("Error details:", error.data);
    }
    process.exit(1);
  }
}

setDemoOrganization();