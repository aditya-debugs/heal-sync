// Script to migrate data from local MongoDB to Atlas
const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function migrateToAtlas() {
  console.log('🔄 MongoDB Migration Tool: Local → Atlas\n');
  
  // Get Atlas connection string from user
  const atlasUri = await new Promise((resolve) => {
    rl.question('Enter your MongoDB Atlas connection string: ', (answer) => {
      resolve(answer.trim());
    });
  });

  if (!atlasUri || atlasUri.length < 10) {
    console.log('❌ Invalid connection string');
    process.exit(1);
  }

  console.log('\n📊 Starting migration...\n');

  try {
    // Connect to local MongoDB
    console.log('1️⃣ Connecting to local MongoDB...');
    const localConnection = await mongoose.createConnection('mongodb://localhost:27017/healsync');
    console.log('   ✅ Connected to local MongoDB\n');

    // Connect to Atlas
    console.log('2️⃣ Connecting to Atlas...');
    const atlasConnection = await mongoose.createConnection(atlasUri);
    console.log('   ✅ Connected to Atlas\n');

    // Define schema (simplified)
    const entitySchema = new mongoose.Schema({}, { strict: false, collection: 'entities' });
    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });

    const LocalEntity = localConnection.model('Entity', entitySchema);
    const LocalUser = localConnection.model('User', userSchema);
    
    const AtlasEntity = atlasConnection.model('Entity', entitySchema);
    const AtlasUser = atlasConnection.model('User', userSchema);

    // Migrate entities
    console.log('3️⃣ Migrating entities...');
    const entities = await LocalEntity.find({}).lean();
    console.log(`   Found ${entities.length} entities in local database`);
    
    if (entities.length > 0) {
      await AtlasEntity.deleteMany({}); // Clear existing
      await AtlasEntity.insertMany(entities);
      console.log(`   ✅ Migrated ${entities.length} entities to Atlas\n`);
    } else {
      console.log('   ⚠️  No entities found in local database\n');
    }

    // Migrate users
    console.log('4️⃣ Migrating users...');
    const users = await LocalUser.find({}).lean();
    console.log(`   Found ${users.length} users in local database`);
    
    if (users.length > 0) {
      await AtlasUser.deleteMany({}); // Clear existing
      await AtlasUser.insertMany(users);
      console.log(`   ✅ Migrated ${users.length} users to Atlas\n`);
    } else {
      console.log('   ⚠️  No users found in local database\n');
    }

    // Summary
    console.log('🎉 Migration Complete!\n');
    console.log('Summary:');
    console.log(`  • Entities: ${entities.length}`);
    console.log(`  • Users: ${users.length}`);
    console.log('\n📊 Breakdown by type:');
    
    const byType = {};
    entities.forEach(e => {
      byType[e.entityType] = (byType[e.entityType] || 0) + 1;
    });
    
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count}`);
    });

    console.log('\n✅ Your data is now in Atlas!');
    console.log('🔄 Next: Update backend/.env with your Atlas connection string\n');

    await localConnection.close();
    await atlasConnection.close();
    
  } catch (error) {
    console.error('\n❌ Migration Error:', error.message);
    process.exit(1);
  }
  
  rl.close();
  process.exit(0);
}

migrateToAtlas();

