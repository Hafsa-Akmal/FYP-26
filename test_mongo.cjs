const { MongoClient } = require('mongodb');

async function testMongo() {
  try {
    console.log('Testing MongoDB connection...');
    const uri = process.env.MONGO_URL || 'mongodb://localhost:27017';
    console.log('URI:', uri);
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('ecommerce');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
  }
}

testMongo();