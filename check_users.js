require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User.model');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const users = await User.find({}, 'email username');
    console.log("Registered Users in Database:");
    console.log(users);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
