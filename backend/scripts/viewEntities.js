// Quick script to view all entities grouped by type
const mongoose = require('mongoose');
const Entity = require('../models/Entity');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healsync';

async function viewEntities() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const entities = await Entity.find({});
    console.log(`📊 Total Entities: ${entities.length}\n`);

    // Group by type
    const byType = {
      hospital: [],
      lab: [],
      pharmacy: [],
      supplier: [],
      cityadmin: []
    };

    entities.forEach(e => {
      if (byType[e.entityType]) {
        byType[e.entityType].push(e);
      }
    });

    // Display hospitals
    console.log('🏥 HOSPITALS (' + byType.hospital.length + '):');
    console.log('─'.repeat(80));
    byType.hospital.forEach((h, i) => {
      const totalBeds = Object.values(h.currentState.beds).reduce((sum, b) => sum + (b.total || 0), 0);
      console.log(`${i + 1}. ${h.name.padEnd(40)} | ${h.zone.padEnd(10)} | ${totalBeds} beds`);
    });

    // Display labs
    console.log('\n🔬 LABS (' + byType.lab.length + '):');
    console.log('─'.repeat(80));
    byType.lab.forEach((l, i) => {
      const testCapacity = l.profile?.testingCapacity?.covid?.daily || 0;
      console.log(`${i + 1}. ${l.name.padEnd(40)} | ${l.zone.padEnd(10)} | ${testCapacity} COVID tests/day`);
    });

    // Display pharmacies
    console.log('\n💊 PHARMACIES (' + byType.pharmacy.length + '):');
    console.log('─'.repeat(80));
    byType.pharmacy.forEach((p, i) => {
      const medicines = Object.keys(p.currentState?.medicines || {}).length;
      console.log(`${i + 1}. ${p.name.padEnd(40)} | ${p.zone.padEnd(10)} | ${medicines} medicine types`);
    });

    // Display suppliers
    console.log('\n📦 SUPPLIERS (' + byType.supplier.length + '):');
    console.log('─'.repeat(80));
    byType.supplier.forEach((s, i) => {
      const items = Object.keys(s.currentState?.inventory || {}).length;
      console.log(`${i + 1}. ${s.name.padEnd(40)} | ${s.zone.padEnd(10)} | ${items} inventory items`);
    });

    // Show sample hospital vs lab structure
    console.log('\n\n🔍 DIFFERENCE BETWEEN ENTITY TYPES:\n');
    
    if (byType.hospital[0]) {
      console.log('HOSPITAL has:');
      console.log('  - entityType: "hospital"');
      console.log('  - currentState.beds (general, ICU, isolation, etc.)');
      console.log('  - currentState.equipment (ventilators, ambulances, etc.)');
      console.log('  - currentState.staff (doctors, nurses)');
      console.log('  - currentState.patientMetrics (inflow, admissions)');
    }

    if (byType.lab[0]) {
      console.log('\nLAB has:');
      console.log('  - entityType: "lab"');
      console.log('  - currentState.testData (dengue, malaria, covid tests)');
      console.log('  - profile.testingCapacity (daily test limits)');
      console.log('  - currentState.equipment (RT-PCR machines, microscopes)');
    }

    if (byType.pharmacy[0]) {
      console.log('\nPHARMACY has:');
      console.log('  - entityType: "pharmacy"');
      console.log('  - currentState.medicines (dengueMed, chloroquine, etc.)');
      console.log('  - profile.storageCapacity (refrigerated, controlled)');
      console.log('  - currentState.pendingOrders');
    }

    if (byType.supplier[0]) {
      console.log('\nSUPPLIER has:');
      console.log('  - entityType: "supplier"');
      console.log('  - currentState.inventory (bulk medicine & equipment stock)');
      console.log('  - profile.logistics (delivery vehicles, daily capacity)');
      console.log('  - currentState.activeOrders');
    }

    console.log('\n✅ The "entityType" field is how you distinguish between them!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

viewEntities();

