import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;
let client;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(process.env.DB_NAME || 'ecommercedb');
}

export async function POST() {
  try {
    const db = await connectToDatabase();

    // Just check if products exist
    const count = await db.collection('products').countDocuments();

    if (count > 0) {
      return NextResponse.json({
        success: true,
        message: 'Products already initialized via seed script',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'No products found. Please run `npm run seed` to load CSV.',
    });
  } catch (error) {
    console.error('Init Data API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
