import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const uri = process.env.MONGO_URL;
let client;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(process.env.DB_NAME || 'ecommerce');
}

export async function POST(request) {
  try {
    const db = await connectToDatabase();
    
    // Check if products already exist
    const existingProducts = await db.collection('products').countDocuments();
    if (existingProducts > 0) {
      return NextResponse.json({ success: true, message: 'Data already initialized' });
    }

    const sampleProducts = [
      {
        id: uuidv4(),
        name: "Classic White T-Shirt",
        price: 29.99,
        image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxzaGlydHxlbnwwfHx8fDE3NTcwOTM1Nzl8MA&ixlib=rb-4.1.0&q=85",
        gender: "men",
        category: "shirts",
        colors: ["white", "black", "navy"],
        sizes: ["S", "M", "L", "XL"],
        description: "Premium cotton classic fit t-shirt perfect for everyday wear."
      },
      {
        id: uuidv4(),
        name: "Blue Checkered Dress Shirt",
        price: 59.99,
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxzaGlydHxlbnwwfHx8fDE3NTcwOTM1Nzl8MA&ixlib=rb-4.1.0&q=85",
        gender: "men",
        category: "shirts",
        colors: ["blue", "white"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        description: "Professional dress shirt with classic checkered pattern."
      },
      {
        id: uuidv4(),
        name: "Casual Outfit Set",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxjbG90aGVzfGVufDB8fHx8MTc1NzA5MzU3MXww&ixlib=rb-4.1.0&q=85",
        gender: "women",
        category: "sets",
        colors: ["beige", "brown"],
        sizes: ["XS", "S", "M", "L"],
        description: "Comfortable casual outfit perfect for weekend wear."
      },
      {
        id: uuidv4(),
        name: "Premium Gold Watch",
        price: 199.99,
        image: "https://images.unsplash.com/photo-1623998021450-85c29c644e0d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwaXRlbXN8ZW58MHx8fHwxNzU3MDkzNTY0fDA&ixlib=rb-4.1.0&q=85",
        gender: "unisex",
        category: "accessories",
        colors: ["gold", "silver"],
        sizes: ["One Size"],
        description: "Elegant gold watch perfect for any occasion."
      },
      {
        id: uuidv4(),
        name: "Designer Jeans",
        price: 79.99,
        image: "https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxjbG90aGVzfGVufDB8fHx8MTc1NzA5MzU3MXww&ixlib=rb-4.1.0&q=85",
        gender: "women",
        category: "jeans",
        colors: ["blue", "black", "gray"],
        sizes: ["26", "27", "28", "29", "30", "31", "32"],
        description: "High-quality designer jeans with perfect fit."
      },
      {
        id: uuidv4(),
        name: "Kids Cotton T-Shirt",
        price: 19.99,
        image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxzaGlydHxlbnwwfHx8fDE3NTcwOTM1Nzl8MA&ixlib=rb-4.1.0&q=85",
        gender: "kids",
        category: "shirts",
        colors: ["white", "blue", "pink", "yellow"],
        sizes: ["2T", "3T", "4T", "5T", "6", "7", "8"],
        description: "Soft cotton t-shirt perfect for active kids."
      }
    ];

    await db.collection('products').insertMany(sampleProducts);
    return NextResponse.json({ success: true, message: 'Sample data initialized' });
  } catch (error) {
    console.error('Init Data API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}