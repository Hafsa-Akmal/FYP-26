import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;
let client;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(process.env.DB_NAME || 'ecommerce');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  try {
    const db = await connectToDatabase();
    
    const gender = searchParams.get('gender');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const color = searchParams.get('color');
    const size = searchParams.get('size');

    let query = {};
    if (gender) query.gender = gender;
    if (category) query.category = category;
    if (color) query.colors = color;
    if (size) query.sizes = size;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const products = await db.collection('products').find(query).limit(50).toArray();
    const transformedProducts = products.map(product => ({
      ...product,
      _id: undefined
    }));
    
    return NextResponse.json({ success: true, products: transformedProducts });
  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}