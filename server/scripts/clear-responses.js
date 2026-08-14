#!/usr/bin/env node
require('dotenv').config();
const readline = require('readline');
const db = require('../src/db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function clearResponses() {
  try {
    const count = db.prepare('SELECT COUNT(*) as c FROM responses').get().c;

    if (count === 0) {
      console.log('ℹ️  No responses to delete.');
      process.exit(0);
    }

    console.log(`⚠️  About to delete ${count} response(s) from the database.`);
    console.log('📝 This action cannot be undone.');

    rl.question('Type "delete" to confirm: ', (answer) => {
      if (answer.toLowerCase() !== 'delete') {
        console.log('❌ Cancelled.');
        rl.close();
        process.exit(0);
      }

      db.prepare('DELETE FROM responses').run();
      console.log(`✅ Deleted ${count} response(s).`);
      console.log('💾 Database is now clean.');
      rl.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    rl.close();
    process.exit(1);
  }
}

clearResponses();
