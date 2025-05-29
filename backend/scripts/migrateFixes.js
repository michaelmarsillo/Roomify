
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const TFSA = require('../models/TFSA');

// TFSA annual limits from 2009 to present
const TFSA_LIMITS = {
  2009: 5000,
  2010: 5000,
  2011: 5000,
  2012: 5000,
  2013: 5500,
  2014: 5500,
  2015: 10000,
  2016: 5500,
  2017: 5500,
  2018: 5500,
  2019: 6000,
  2020: 6000,
  2021: 6000,
  2022: 6000,
  2023: 6500,
  2024: 7000,
  2025: 7000
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateUsers = async () => {
  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      // Skip users who already have fixedContributionRoom set
      if (user.fixedContributionRoom && user.fixedContributionRoom > 0) {
        console.log(`User ${user.email} already has fixedContributionRoom: ${user.fixedContributionRoom}`);
        continue;
      }
      
      // Method 1: Calculate from TFSA records
      const tfsaRecords = await TFSA.find({ user: user._id });
      if (tfsaRecords.length > 0) {
        const totalRoom = tfsaRecords.reduce((sum, record) => sum + record.contributionLimit, 0);
        user.fixedContributionRoom = totalRoom;
        await user.save();
        console.log(`Set fixedContributionRoom for ${user.email} to ${totalRoom} from TFSA records`);
        continue;
      }
      
      // Method 2: Calculate from yearTurned18
      if (user.yearTurned18) {
        const currentYear = new Date().getFullYear();
        const startYear = Math.max(2009, user.yearTurned18);
        let totalRoom = 0;
        
        for (let year = startYear; year <= currentYear; year++) {
          if (TFSA_LIMITS[year]) {
            totalRoom += TFSA_LIMITS[year];
          }
        }
        
        user.fixedContributionRoom = totalRoom;
        await user.save();
        console.log(`Set fixedContributionRoom for ${user.email} to ${totalRoom} from yearTurned18`);
        continue;
      }
      
      console.log(`Could not calculate fixedContributionRoom for ${user.email}`);
    }
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

const main = async () => {
  await connectDB();
  await migrateUsers();
  process.exit(0);
};

main(); 