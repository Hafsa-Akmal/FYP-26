import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const uri = process.env.MONGO_URL;
let client;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db('ecommerce');
}

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}

// Helper function to get user from token
async function getUserFromToken(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const db = await connectToDatabase();
  const user = await db.collection('users').findOne({ id: decoded.userId });
  return user;
}

export async function GET(request) {
  const { searchParams, pathname } = new URL(request.url);
  const db = await connectToDatabase();

  try {
    // Auth routes
    if (pathname.includes('/api/auth/me')) {
      const user = await getUserFromToken(request);
      if (!user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
      }
      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email }
      });
    }

    // Products routes
    if (pathname.includes('/api/products')) {
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
    }

    // Cart routes
    if (pathname.includes('/api/cart')) {
      const user = await getUserFromToken(request);
      if (!user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
      }

      const cart = await db.collection('carts').findOne({ userId: user.id });
      return NextResponse.json({ 
        success: true, 
        cart: cart ? cart.items : [] 
      });
    }

    // Categories route
    if (pathname.includes('/api/categories')) {
      const categories = [
        { id: 'mens', name: "Men's", gender: 'men' },
        { id: 'womens', name: "Women's", gender: 'women' },
        { id: 'kids', name: "Kids", gender: 'kids' },
        { id: 'accessories', name: "Accessories", gender: 'unisex' }
      ];
      return NextResponse.json({ success: true, categories });
    }

    return NextResponse.json({ message: 'API endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { pathname } = new URL(request.url);
  const db = await connectToDatabase();
  const body = await request.json();

  try {
    // Auth routes
    if (pathname.includes('/api/auth/register')) {
      const { name, email, password } = body;

      // Check if user exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const userId = uuidv4();
      const user = {
        id: userId,
        name,
        email,
        password: hashedPassword,
        createdAt: new Date()
      };

      await db.collection('users').insertOne(user);

      // Generate token
      const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });

      // Set cookie
      const response = NextResponse.json({
        success: true,
        user: { id: userId, name, email }
      });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });

      return response;
    }

    if (pathname.includes('/api/auth/login')) {
      const { email, password } = body;

      // Find user
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });

      // Set cookie
      const response = NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email }
      });
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });

      return response;
    }

    if (pathname.includes('/api/auth/logout')) {
      const response = NextResponse.json({ success: true, message: 'Logged out' });
      response.cookies.delete('token');
      return response;
    }

    // Cart routes
    if (pathname.includes('/api/cart/add')) {
      const user = await getUserFromToken(request);
      if (!user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
      }

      const { productId, quantity = 1, size, color } = body;

      // Get or create cart
      let cart = await db.collection('carts').findOne({ userId: user.id });
      if (!cart) {
        cart = { userId: user.id, items: [] };
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId === productId && item.size === size && item.color === color
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Get product details
        const product = await db.collection('products').findOne({ id: productId });
        if (!product) {
          return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        cart.items.push({
          productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity,
          size,
          color
        });
      }

      // Update cart in database
      await db.collection('carts').replaceOne(
        { userId: user.id },
        cart,
        { upsert: true }
      );

      return NextResponse.json({ success: true, cart: cart.items });
    }

    if (pathname.includes('/api/cart/remove')) {
      const user = await getUserFromToken(request);
      if (!user) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
      }

      const { productId, size, color } = body;

      const cart = await db.collection('carts').findOne({ userId: user.id });
      if (!cart) {
        return NextResponse.json({ success: true, cart: [] });
      }

      // Remove item from cart
      cart.items = cart.items.filter(
        item => !(item.productId === productId && item.size === size && item.color === color)
      );

      await db.collection('carts').replaceOne({ userId: user.id }, cart);

      return NextResponse.json({ success: true, cart: cart.items });
    }

    // Initialize sample data
    if (pathname.includes('/api/init-data')) {
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
    }

    return NextResponse.json({ message: 'API endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}