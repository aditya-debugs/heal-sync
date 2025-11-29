// Quick setup: Push data to Atlas and configure backend
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Atlas Setup\n');
console.log('This will:');
console.log('  1. Connect to your local MongoDB');
console.log('  2. Connect to your Atlas');
console.log('  3. Copy all data to Atlas');
console.log('  4. Update your .env file\n');

// Get Atlas connection string from command line
const atlasUri = process.argv[2];

if (!atlasUri || atlasUri.length < 20) {
  console.log('❌ Error: Atlas connection string required!\n');
  console.log('Usage:');
  console.log('  node scripts/quickAtlasSetup.js "YOUR_ATLAS_CONNECTION_STRING"\n');
  console.log('Example:');
  console.log('  node scripts/quickAtlasSetup.js "mongodb+srv://user:pass@cluster.mongodb.net/healsync"\n');
  console.log('Get your connection string from Atlas:');
  console.log('  1. Click "Connect" button in Atlas');
  console.log('  2. Choose "Connect your application"');
  console.log('  3. Copy the connection string');
  console.log('  4. Replace <password> with your actual password');
  console.log('  5. Add "/healsync" before the "?"');
  process.exit(1);
}

async function setupAtlas() {
  try {
    console.log('📊 Step 1: Connecting to local MongoDB...');
    const localConn = await mongoose.createConnection('mongodb://localhost:27017/healsync', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('   ✅ Connected to local MongoDB\n');

    console.log('📊 Step 2: Connecting to Atlas...');
    const atlasConn = await mongoose.createConnection(atlasUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('   ✅ Connected to Atlas\n');

    // Define schemas
    const anySchema = new mongoose.Schema({}, { strict: false });
    
    const LocalEntity = localConn.model('Entity', anySchema, 'entities');
    const LocalUser = localConn.model('User', anySchema, 'users');
    
    const AtlasEntity = atlasConn.model('Entity', anySchema, 'entities');
    const AtlasUser = atlasConn.model('User', anySchema, 'users');

    console.log('📊 Step 3: Fetching data from local...');
    const entities = await LocalEntity.find({}).lean();
    const users = await LocalUser.find({}).lean();
    console.log(`   Found ${entities.length} entities and ${users.length} users\n`);

    if (entities.length === 0) {
      console.log('❌ No data found in local MongoDB!');
      console.log('   Run: node scripts/seedDatabase.js first\n');
      process.exit(1);
    }

    console.log('📊 Step 4: Copying to Atlas...');
    
    // Clear Atlas and insert data
    await AtlasEntity.deleteMany({});
    await AtlasUser.deleteMany({});
    
    await AtlasEntity.insertMany(entities);
    await AtlasUser.insertMany(users);
    
    console.log(`   ✅ Copied ${entities.length} entities to Atlas`);
    console.log(`   ✅ Copied ${users.length} users to Atlas\n`);

    // Show breakdown
    console.log('📊 Data Breakdown:');
    const byType = {};
    entities.forEach(e => {
      byType[e.entityType] = (byType[e.entityType] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log('\n📊 Step 5: Updating .env file...');
    const envPath = path.join(__dirname, '../.env');
    const envContent = `MONGODB_URI=${atlasUri}\nPORT=4000\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('   ✅ Created backend/.env with Atlas connection\n');

    await localConn.close();
    await atlasConn.close();

    console.log('🎉 SUCCESS! Your data is now in Atlas!\n');
    console.log('Next steps:');
    console.log('  1. Refresh your Atlas Data Explorer');
    console.log('  2. Click on "entities" collection');
    console.log('  3. You should see all 23 documents!');
    console.log('\nTo start backend with Atlas:');
    console.log('  cd backend');
    console.log('  node server.js\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nCommon issues:');
    console.error('  • Wrong password in connection string');
    console.error('  • IP not whitelisted in Atlas');
    console.error('  • Connection string format incorrect');
    console.error('\nConnection string should look like:');
    console.error('  mongodb+srv://username:password@cluster.mongodb.net/healsync?retryWrites=true&w=majority\n');
    process.exit(1);
  }
}

setupAtlas();

