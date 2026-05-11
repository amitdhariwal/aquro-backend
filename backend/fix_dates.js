const mongoose = require('mongoose');
const Production = require('./models/Production');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aquro-admin';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const productions = await Production.find();
    console.log(`Found ${productions.length} production entries.`);
    
    let updatedCount = 0;
    
    for (const prod of productions) {
      // Check if batch is 6 digits long (DDMMYY)
      if (prod.batch && prod.batch.length === 6 && /^\d+$/.test(prod.batch)) {
        const dd = prod.batch.slice(0, 2);
        const mm = prod.batch.slice(2, 4);
        const yy = prod.batch.slice(4, 6);
        
        // Format as YYYY-MM-DD for the HTML date input
        const newDate = `20${yy}-${mm}-${dd}`;
        
        // Update if it's different
        if (prod.date !== newDate) {
          prod.date = newDate;
          await prod.save();
          console.log(`Updated batch ${prod.batch} with new date: ${newDate}`);
          updatedCount++;
        }
      }
    }
    
    console.log(`Successfully updated ${updatedCount} entries.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
