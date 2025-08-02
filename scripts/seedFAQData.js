#!/usr/bin/env node

/**
 * Script để seed FAQ data cho chat system
 * Chạy: node seedFAQData.js
 */

const { seedFAQData } = require("../data/faqSampleData");

async function runSeed() {
  console.log("🚀 Starting FAQ Data Seeding...");
  
  try {
    const success = await seedFAQData();
    
    if (success) {
      console.log("🎉 FAQ data seeding completed successfully!");
      process.exit(0);
    } else {
      console.log("❌ FAQ data seeding failed!");
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Unexpected error during seeding:", error);
    process.exit(1);
  }
}

// Run the seed function
runSeed();
