/**
 * Seed script — Nagpur hospitals, doctors, demo users
 * Run: node utils/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');
const Hospital = require('../models/Hospital');

const DEPARTMENTS = [
  'Cardiology', 'Orthopedics', 'Neurology',
  'General Medicine', 'Pediatrics',
];

// ── Hospitals ─────────────────────────────────────────────────────────────────
const HOSPITALS = [
  {
    name: 'SevenStar Hospital Nagpur',
    address: { street: 'Ramdaspeth, Wardha Road', city: 'Nagpur', state: 'Maharashtra', pincode: '440012' },
    location: { lat: 21.1466, lng: 79.0920 },
    phone: '0712-2441444',
    email: 'info@sevenstarhospital.com',
    departments: DEPARTMENTS,
  },
  {
    name: 'Orange City Hospital & Research Institute',
    address: { street: 'Khamla, Wardha Road', city: 'Nagpur', state: 'Maharashtra', pincode: '440025' },
    location: { lat: 21.1232, lng: 79.0789 },
    phone: '0712-6677000',
    email: 'info@orangecityhospital.com',
    departments: DEPARTMENTS,
  },
  {
    name: 'Wockhardt Hospital Nagpur',
    address: { street: 'Trimurti Nagar, Nagpur', city: 'Nagpur', state: 'Maharashtra', pincode: '440022' },
    location: { lat: 21.1385, lng: 79.1007 },
    phone: '0712-6626000',
    email: 'nagpur@wockhardthospitals.com',
    departments: DEPARTMENTS,
  },
  {
    name: 'Alexis Multispeciality Hospital',
    address: { street: 'Manish Nagar, Sonegaon', city: 'Nagpur', state: 'Maharashtra', pincode: '440015' },
    location: { lat: 21.0984, lng: 79.0612 },
    phone: '0712-2972972',
    email: 'info@alexishospital.in',
    departments: DEPARTMENTS,
  },
];

// ── Doctor templates (2 per dept per hospital) ────────────────────────────────
const DOCTOR_TEMPLATES = {
  Cardiology: [
    { firstName: 'Dr. Rajesh', lastName: 'Verma',    avgTime: 15 },
    { firstName: 'Dr. Sunita', lastName: 'Agrawal',  avgTime: 12 },
  ],
  Orthopedics: [
    { firstName: 'Dr. Anil',   lastName: 'Thakur',   avgTime: 20 },
    { firstName: 'Dr. Pooja',  lastName: 'Sharma',   avgTime: 18 },
  ],
  Neurology: [
    { firstName: 'Dr. Nitin',  lastName: 'Desai',    avgTime: 20 },
    { firstName: 'Dr. Meena',  lastName: 'Joshi',    avgTime: 15 },
  ],
  'General Medicine': [
    { firstName: 'Dr. Rahul',  lastName: 'Mishra',   avgTime: 10 },
    { firstName: 'Dr. Kavita', lastName: 'Rao',      avgTime: 10 },
  ],
  Pediatrics: [
    { firstName: 'Dr. Saurabh', lastName: 'Gupta',   avgTime: 12 },
    { firstName: 'Dr. Anjali',  lastName: 'Patel',   avgTime: 12 },
  ],
};

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🌱 Connected to MongoDB');

  // Wipe
  await User.deleteMany({});
  await Hospital.deleteMany({});
  console.log('🗑  Cleared existing data');

  // Create hospitals
  const hospitals = await Hospital.insertMany(HOSPITALS);
  console.log(`✅ Created ${hospitals.length} hospitals`);

  // Create doctors (2 per dept × 5 depts × 4 hospitals = 40 doctors)
  const doctorDocs = [];
  let emailIdx = 1;

  for (const hospital of hospitals) {
    for (const [dept, templates] of Object.entries(DOCTOR_TEMPLATES)) {
      for (const tmpl of templates) {
        const hospitalSlug = hospital.name.split(' ')[0].toLowerCase();
        doctorDocs.push({
          name: `${tmpl.firstName} ${tmpl.lastName}`,
          email: `doctor${emailIdx++}@${hospitalSlug}.com`,
          password: 'Doctor@123',
          role: 'doctor',
          specialization: dept,
          department: dept,
          hospital: hospital._id,
          isAvailable: true,
          avgConsultationTime: tmpl.avgTime,
          phone: `98225${String(emailIdx).padStart(5, '0')}`,
        });
      }
    }
  }

  console.log(`About to create ${doctorDocs.length} doctor docs`);
  let doctors;
  try {
    doctors = await User.create(doctorDocs);
    console.log(`✅ Created ${doctors.length} doctors`);
  } catch (e) {
    console.error('Error creating doctors:', e);
    throw e;
  }

  // Receptionists (one per hospital)
  const receptionistDocs = hospitals.map((h, i) => ({
    name: `Reception ${h.name.split(' ')[0]}`,
    email: `receptionist${i + 1}@mediqueue.com`,
    password: 'Recept@123',
    role: 'receptionist',
    hospital: h._id,
    phone: `90000${String(i + 1).padStart(5, '0')}`,
  }));
  await User.create(receptionistDocs);
  console.log(`✅ Created ${receptionistDocs.length} receptionists`);

  // Demo patient
  await User.create({
    name: 'Arjun Kumar',
    email: 'patient@demo.com',
    password: 'Patient@123',
    role: 'patient',
    phone: '9111111111',
    location: { lat: 21.1466, lng: 79.0920, city: 'Nagpur' },
  });

  console.log('\n📋 Demo Credentials:');
  console.log('  Patient:       patient@demo.com          / Patient@123');
  console.log('  Receptionist:  receptionist1@mediqueue.com / Recept@123');
  console.log('  Doctor:        doctor1@sevenstar.com       / Doctor@123');
  console.log('\n🏥 Hospitals created:');
  hospitals.forEach(h => console.log(`  • ${h.name} — ${h.address.city}`));
  console.log(`\n👨‍⚕️  ${doctors.length} doctors across ${hospitals.length} hospitals (${Object.keys(DOCTOR_TEMPLATES).length} departments each)`);

  await mongoose.disconnect();
  console.log('\n✅ Seed complete!');
};

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
