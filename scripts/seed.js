// scripts/seed.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'ecommercedb';

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const productsCollection = db.collection('products');

    // Check if already seeded
    const count = await productsCollection.countDocuments();
    if (count > 0) {
      console.log("✅ Products already seeded. Skipping...");
      return;
    }

    // Read CSV
    const filePath = path.join(process.cwd(), 'data', 'myntra_products_catalog.csv');
    const csv = fs.readFileSync(filePath, 'utf8');
    const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

    // Map rows → documents
    const docs = parsed.data.map(row => ({
      productId: row["ProductID"]?.trim(),
      name: row["ProductName"]?.trim(),
      brand: row["ProductBrand"]?.trim(),
      gender: row["Gender"]?.toLowerCase(),
      price: parseFloat(row["Price (INR)"]) || 0,
      numImages: parseInt(row["NumImages"]) || 0,
      description: row["Description"]?.trim()
    })).filter(doc => doc.productId && doc.name);

    if (!docs.length) {
      console.log("⚠️ No valid rows found in CSV.");
      return;
    }

    // Insert into MongoDB
    const result = await productsCollection.insertMany(docs);
    console.log(`✅ Seeded ${result.insertedCount} products.`);
  } catch (err) {
    console.error("❌ Seeding error:", err);
  } finally {
    await client.close();
  }
}

seed();
