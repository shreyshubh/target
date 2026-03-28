/**
 * One-time migration script to:
 * 1. Create user "shrey" with password "shreyshubham"
 * 2. Assign all existing data to shrey's userId
 * 3. Create a Syllabus doc from the hardcoded tracks data
 *
 * Run: node src/migrate.js
 */

const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User.model');
const Attendance = require('./models/Attendance.model');
const Todo = require('./models/Todo.model');
const Progress = require('./models/Progress.model');
const Syllabus = require('./models/Syllabus.model');

// Read the tracks data from the ESM file and parse it manually
function loadTracks() {
  const filePath = path.join(__dirname, '../frontend/src/data/tracks.js');
  let content = fs.readFileSync(filePath, 'utf-8');
  // Remove ESM export and const declaration
  content = content.replace(/^const TRACKS\s*=\s*/m, 'return ');
  content = content.replace(/;\s*export default TRACKS;\s*$/, ';');
  // Wrap in a function and evaluate
  const fn = new Function(content);
  return fn();
}

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Create or find user "shrey"
    let user = await User.findOne({ username: 'shrey' });
    if (!user) {
      user = new User({
        username: 'shrey',
        email: 'shreyshubham07@gmail.com',
        passwordHash: 'shreyshubham', // pre-save hook will hash
      });
      await user.save();
      console.log('✅ Created user "shrey"');
    } else {
      console.log('ℹ️  User "shrey" already exists, skipping creation');
    }

    const userId = user._id;

    // 2. Assign all existing Attendance docs to shrey
    const attResult1 = await Attendance.updateMany(
      { userId: { $exists: false } },
      { $set: { userId } }
    );
    const attResult2 = await Attendance.updateMany(
      { userId: null },
      { $set: { userId } }
    );
    console.log(`✅ Attendance: ${attResult1.modifiedCount + attResult2.modifiedCount} docs updated`);

    // 3. Assign all existing Todo docs to shrey
    const todoResult1 = await Todo.updateMany(
      { userId: { $exists: false } },
      { $set: { userId } }
    );
    const todoResult2 = await Todo.updateMany(
      { userId: null },
      { $set: { userId } }
    );
    console.log(`✅ Todos: ${todoResult1.modifiedCount + todoResult2.modifiedCount} docs updated`);

    // 4. Handle Progress migration (string userId -> ObjectId)
    const oldProgress = await mongoose.connection.db.collection('progresses').findOne({ userId: 'guest' });
    if (oldProgress) {
      await mongoose.connection.db.collection('progresses').deleteOne({ userId: 'guest' });
      await Progress.findOneAndUpdate(
        { userId },
        { $set: { progress: oldProgress.progress || {} } },
        { upsert: true }
      );
      console.log('✅ Progress: migrated from guest to shrey');
    } else {
      console.log('ℹ️  No guest progress found, skipping');
    }

    // 5. Create Syllabus doc for shrey from hardcoded tracks
    let syllabusDoc = await Syllabus.findOne({ userId });
    if (!syllabusDoc) {
      try {
        const TRACKS = loadTracks();
        const tracks = TRACKS.map(t => ({
          id: t.id,
          label: t.label,
          sections: t.sections.map(s => ({
            title: s.title,
            topics: [...s.topics],
          })),
        }));
        syllabusDoc = new Syllabus({ userId, tracks });
        await syllabusDoc.save();
        console.log(`✅ Syllabus: created with ${tracks.length} tracks`);
      } catch (err) {
        console.error('⚠️  Could not parse tracks.js, creating empty syllabus:', err.message);
        syllabusDoc = new Syllabus({ userId, tracks: [] });
        await syllabusDoc.save();
      }
    } else {
      console.log('ℹ️  Syllabus already exists for shrey, skipping');
    }

    console.log('\n🎉 Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
