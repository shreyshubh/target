require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
dns.setDefaultResultOrder('ipv4first');
const Attendance = require('../src/models/Attendance.model');
const AttendanceRecord = require('../src/models/AttendanceRecord.model');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const attendances = await Attendance.find({});
    console.log(`Found ${attendances.length} Attendance documents to process.`);

    let recordsInserted = 0;

    for (const doc of attendances) {
      if (!doc.records) continue;

      const newRecords = [];
      const userId = doc.userId;

      // Iterate the Map: Map date string -> Map subjectId -> status string
      for (const [date, subjectMap] of doc.records.entries()) {
        for (const [subjectId, status] of subjectMap.entries()) {
          newRecords.push({
            userId,
            date,
            subjectId,
            status,
          });
        }
      }

      if (newRecords.length > 0) {
        // Upsert to prevent crashes on rerun
        await Promise.all(
          newRecords.map(record =>
            AttendanceRecord.findOneAndUpdate(
              { userId: record.userId, date: record.date, subjectId: record.subjectId },
              { $set: record },
              { upsert: true }
            )
          )
        );
        recordsInserted += newRecords.length;
        console.log(`Processed ${newRecords.length} records for User ${userId}`);
      }
    }

    console.log(`🎉 Migration complete! Exported ${recordsInserted} total records to the new Model.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
