// backend/scripts/seedDatabase.js - Load from JSON files
const mongoose = require('mongoose');
const Entity = require('../models/Entity');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healsync';

// Load JSON data files
const hospitalsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hospitals.json'), 'utf8'));
const labsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/labs.json'), 'utf8'));
const pharmaciesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pharmacies.json'), 'utf8'));
const suppliersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/suppliers.json'), 'utf8'));
const cityAdminData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cityAdmin.json'), 'utf8'));

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding from JSON files...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Entity.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const entities = [];
    const users = [];

    // Seed Hospitals
    console.log('🏥 Seeding hospitals...');
    for (const hospital of hospitalsData) {
      const entity = await Entity.create({
        entityType: 'hospital',
        name: hospital.name,
        email: hospital.email,
        phone: hospital.phone,
        zone: hospital.zone,
        address: hospital.address,
        coordinates: hospital.coordinates,
        profile: {
          type: hospital.type,
          beds: hospital.beds,
          equipment: hospital.equipment,
          staff: hospital.staff
        },
        currentState: {
          beds: {
            general: { total: hospital.beds.general.total, used: 0, reserved: 0 },
            icu: { total: hospital.beds.icu.total, used: 0, reserved: 0 },
            isolation: { total: hospital.beds.isolation.total, used: 0, reserved: 0 },
            pediatric: { total: hospital.beds.pediatric.total, used: 0, reserved: 0 },
            maternity: { total: hospital.beds.maternity.total, used: 0, reserved: 0 }
          },
          equipment: {
            ventilators: { 
              total: hospital.equipment.ventilators.total, 
              available: hospital.equipment.ventilators.total, 
              inUse: 0, 
              maintenance: 0 
            },
            oxygenCylinders: { 
              total: hospital.equipment.oxygenCylinders.total, 
              available: hospital.equipment.oxygenCylinders.total, 
              inUse: 0, 
              empty: 0 
            },
            xrayMachines: { 
              total: hospital.equipment.xrayMachines.total, 
              available: hospital.equipment.xrayMachines.total, 
              inUse: 0, 
              maintenance: 0 
            },
            ctScanners: { 
              total: hospital.equipment.ctScanners.total, 
              available: hospital.equipment.ctScanners.total, 
              inUse: 0, 
              maintenance: 0 
            },
            ambulances: { 
              total: hospital.equipment.ambulances.total, 
              available: hospital.equipment.ambulances.total, 
              onRoute: 0, 
              maintenance: 0 
            }
          },
          staff: {
            doctors: { 
              total: hospital.staff.doctors.total, 
              onDuty: hospital.staff.doctors.total, 
              available: hospital.staff.doctors.total, 
              onLeave: 0 
            },
            nurses: { 
              total: hospital.staff.nurses.total, 
              onDuty: hospital.staff.nurses.total, 
              available: hospital.staff.nurses.total, 
              onLeave: 0 
            },
            specialists: { infectiousDisease: hospital.staff.specialists.infectiousDisease }
          },
          patientMetrics: {
            inflowPerHour: 12,
            avgStayDuration: 48,
            dischargesPerDay: 20,
            emergencyCases: 8,
            outpatients: 45,
            admissionsToday: 0,
            erWaitingTime: 30
          },
          diseasePrep: {
            dengue: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
            malaria: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
            covid: { prepared: true, wardReady: true, medicineStock: "high", staffAlerted: true },
            typhoid: { prepared: false, wardReady: false, medicineStock: "adequate", staffAlerted: false },
            influenza: { prepared: true, wardReady: true, medicineStock: "adequate", staffAlerted: true }
          },
          history: {
            bedsUsed: [],
            patientInflow: [],
            emergencyCases: []
          }
        },
        status: 'active'
      });

      entities.push(entity);
      users.push({
        email: hospital.email,
        password: 'password123',
        role: 'hospital',
        entityId: entity._id,
        name: hospital.name,
        status: 'active'
      });
    }
    console.log(`✅ Created ${hospitalsData.length} hospitals`);

    // Seed Labs
    console.log('🔬 Seeding labs...');
    for (const lab of labsData) {
      const entity = await Entity.create({
        entityType: 'lab',
        name: lab.name,
        email: lab.email,
        phone: lab.phone,
        zone: lab.zone,
        address: lab.address,
        coordinates: lab.coordinates,
        profile: {
          type: lab.type,
          testingCapacity: lab.testingCapacity,
          equipment: lab.equipment,
          staff: lab.staff
        },
        currentState: {
          testData: {
            dengue: { today: 12, positive: 2, capacity: lab.testingCapacity.dengue.daily, history: [10, 11, 12], positiveRate: 0, tickCount: 0 },
            malaria: { today: 8, positive: 1, capacity: lab.testingCapacity.malaria.daily, history: [7, 8, 8], positiveRate: 0, tickCount: 0 },
            typhoid: { today: 5, positive: 0, capacity: lab.testingCapacity.typhoid.daily, history: [4, 5, 5], positiveRate: 0, tickCount: 0 },
            influenza: { today: 15, positive: 3, capacity: lab.testingCapacity.bloodTests.daily, history: [12, 14, 15], positiveRate: 0, tickCount: 0 },
            covid: { today: 20, positive: 1, capacity: lab.testingCapacity.covid.daily, history: [18, 19, 20], positiveRate: 0, tickCount: 0 }
          },
          equipment: lab.equipment,
          history: {
            testsProcessed: []
          }
        },
        status: 'active'
      });

      entities.push(entity);
      users.push({
        email: lab.email,
        password: 'password123',
        role: 'lab',
        entityId: entity._id,
        name: lab.name,
        status: 'active'
      });
    }
    console.log(`✅ Created ${labsData.length} labs`);

    // Seed Pharmacies
    console.log('💊 Seeding pharmacies...');
    for (const pharmacy of pharmaciesData) {
      const entity = await Entity.create({
        entityType: 'pharmacy',
        name: pharmacy.name,
        email: pharmacy.email,
        phone: pharmacy.phone,
        zone: pharmacy.zone,
        address: pharmacy.address,
        coordinates: pharmacy.coordinates,
        profile: {
          type: pharmacy.type,
          storageCapacity: pharmacy.storageCapacity,
          staff: pharmacy.staff
        },
        currentState: {
          medicines: pharmacy.medicines,
          pendingOrders: [],
          history: {
            inventory: []
          }
        },
        status: 'active'
      });

      entities.push(entity);
      users.push({
        email: pharmacy.email,
        password: 'password123',
        role: 'pharmacy',
        entityId: entity._id,
        name: pharmacy.name,
        status: 'active'
      });
    }
    console.log(`✅ Created ${pharmaciesData.length} pharmacies`);

    // Seed Suppliers
    console.log('📦 Seeding suppliers...');
    for (const supplier of suppliersData) {
      const entity = await Entity.create({
        entityType: 'supplier',
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        zone: supplier.zone,
        address: supplier.address,
        coordinates: supplier.coordinates,
        profile: {
          type: supplier.type,
          serviceZones: supplier.serviceZones,
          logistics: supplier.logistics,
          staff: supplier.staff
        },
        currentState: {
          inventory: supplier.inventory,
          activeOrders: []
        },
        status: 'active'
      });

      entities.push(entity);
      users.push({
        email: supplier.email,
        password: 'password123',
        role: 'supplier',
        entityId: entity._id,
        name: supplier.name,
        status: 'active'
      });
    }
    console.log(`✅ Created ${suppliersData.length} suppliers`);

    // Seed City Admin
    console.log('🏛️  Creating city admin...');
    const cityAdminEntity = await Entity.create({
      entityType: 'cityadmin',
      name: cityAdminData.departmentName,
      email: cityAdminData.email,
      phone: cityAdminData.phone,
      zone: cityAdminData.zone,
      address: cityAdminData.address,
      coordinates: cityAdminData.coordinates,
      profile: cityAdminData.profile,
      currentState: {},
      status: 'active'
    });

    entities.push(cityAdminEntity);
    users.push({
      email: cityAdminData.email,
      password: 'admin123',
      role: 'cityadmin',
      entityId: cityAdminEntity._id,
      name: cityAdminData.name,
      status: 'active'
    });
    console.log('✅ Created city admin');

    // Create users
    console.log('👥 Creating user accounts...');
    for (const userData of users) {
      await User.create(userData);
    }
    console.log(`✅ Created ${users.length} user accounts`);

    console.log('\n📊 Seeding Summary:');
    console.log(`   Hospitals: ${hospitalsData.length}`);
    console.log(`   Labs: ${labsData.length}`);
    console.log(`   Pharmacies: ${pharmaciesData.length}`);
    console.log(`   Suppliers: ${suppliersData.length}`);
    console.log(`   City Admin: 1`);
    console.log(`   Total Entities: ${entities.length}`);
    console.log(`   Total Users: ${users.length}`);
    console.log(`   Total Agents: ${entities.length} (${hospitalsData.length} hospitals + ${labsData.length} labs + ${pharmaciesData.length} pharmacies + ${suppliersData.length} suppliers + 1 city)`);

    console.log('\n🔑 Default Credentials:');
    console.log(`   Hospitals: ${hospitalsData[0].email} / password123`);
    console.log(`   Labs: ${labsData[0].email} / password123`);
    console.log(`   Pharmacies: ${pharmaciesData[0].email} / password123`);
    console.log(`   Suppliers: ${suppliersData[0].email} / password123`);
    console.log(`   City Admin: ${cityAdminData.email} / admin123`);

    console.log('\n✅ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
