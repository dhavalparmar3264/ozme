/**
 * Script to create 8 new OZMÉ perfume products
 * Run: node create_products.js
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://www.ozme.in/api';
const ADMIN_EMAIL = 'admin@ozme.in';
const ADMIN_PASSWORD = 'Ozme@0911';

// Product data
const products = [
  {
    name: 'Cristal 7 Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml',
    shortDescription: 'A clean and sparkling fragrance with fresh citrus, soft florals, and smooth musks for effortless everyday elegance.',
    description: 'Cristal 7 Extrait de Parfum is a bright and refreshing scent crafted for those who love clarity and sophistication. It opens with crisp citrus and airy fresh notes that feel instantly uplifting. The heart reveals soft floral nuances, balanced perfectly with subtle woody tones. As it dries down, smooth musks add depth and long-lasting comfort. A versatile unisex fragrance ideal for daily wear, office use, and warm climates.',
    category: 'Fresh & Daily Sourced',
    gender: 'Unisex',
    originalPrice: 1499,
    price: 899,
    stockQuantity: 50,
  },
  {
    name: 'Paradox Infinity Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml',
    shortDescription: 'A bold and intense fragrance blending warm spices, deep woods, and rich amber for a powerful statement.',
    description: 'Paradox Infinity Extrait de Parfum is designed for those who command attention. It opens with an intriguing mix of spicy and aromatic notes, creating an immediate sense of mystery. The heart is rich with woody accords that add strength and character, while the base of amber and musk delivers warmth and long-lasting intensity. Perfect for evenings, special occasions, and confident personalities.',
    category: 'Fresh & Daily Sourced',
    gender: 'Unisex',
    originalPrice: 1499,
    price: 899,
    stockQuantity: 50,
  },
  {
    name: 'Fantasy Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml',
    shortDescription: 'A playful and sweet fragrance with fruity notes, soft florals, and a creamy musky finish.',
    description: 'Fantasy Extrait de Parfum is a joyful blend that captures a carefree and youthful spirit. It opens with delicious fruity notes that feel vibrant and fun, followed by a delicate floral heart that adds softness. The base settles into creamy vanilla and gentle musk, leaving a comforting and addictive trail. Ideal for casual wear, daytime outings, and those who love sweet, cheerful scents.',
    category: 'Fresh & Daily Sourced',
    gender: 'Unisex',
    originalPrice: 1499,
    price: 899,
    stockQuantity: 50,
  },
  {
    name: 'Interstellar Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml',
    shortDescription: 'A dark, powerful fragrance with smoky woods, spices, and amber inspired by the mystery of space.',
    description: 'Interstellar Extrait de Parfum is a deep and captivating scent for lovers of intense fragrances. It opens with bold spices and aromatic notes that immediately set a dramatic tone. The heart features smoky woods and resinous accords, creating depth and intrigue. A warm amber and musky base ensures exceptional longevity. Best suited for night wear and statement-making moments.',
    category: 'Fresh & Daily Sourced',
    gender: 'Unisex',
    originalPrice: 1499,
    price: 899,
    stockQuantity: 50,
  },
  {
    name: 'Céleste Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml',
    shortDescription: 'A soft, elegant fragrance with airy florals, fresh notes, and clean musks for a calming presence.',
    description: 'Céleste Extrait de Parfum is a graceful and soothing scent that feels light yet refined. It opens with fresh, delicate notes that transition into a floral heart full of softness and balance. The base of clean musks and subtle woods adds a smooth, lasting finish. Perfect for daily wear, minimalists, and those who prefer gentle, elegant fragrances.',
    category: 'Fresh & Daily Sourced',
    gender: 'Unisex',
    originalPrice: 1499,
    price: 899,
    stockQuantity: 50,
  },
  {
    name: 'Halo Sky Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml',
    shortDescription: 'A fresh and breezy fragrance with citrus, aquatic notes, and soft woods for all-day freshness.',
    description: 'Halo Sky Extrait de Parfum delivers a refreshing experience inspired by open skies and cool air. It opens with bright citrus and aquatic accords that feel clean and energizing. The heart introduces light aromatic tones, while the base of soft woods and musk keeps the fragrance balanced and long-lasting. Ideal for summer, travel, and everyday wear.',
    category: 'Fresh & Daily Sourced',
    gender: 'Unisex',
    originalPrice: 1499,
    price: 899,
    stockQuantity: 50,
  },
  {
    name: 'Floralé Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml',
    shortDescription: 'A romantic floral fragrance with blooming petals and a smooth musky base, elegant and timeless.',
    description: 'Floralé Extrait de Parfum is a celebration of floral beauty. It begins with fresh, blooming floral notes that feel vibrant and graceful. The heart reveals layered petals that add richness without overpowering. A soft musky and woody base provides warmth and excellent longevity. A perfect choice for lovers of classic florals with a modern touch.',
    category: 'Fresh & Daily Sourced',
    gender: 'Unisex',
    originalPrice: 1499,
    price: 899,
    stockQuantity: 50,
  },
  {
    name: 'Amber Prime Extrait de Parfum | Premium Unisex Perfume | Long Lasting, 120 ml',
    shortDescription: 'A warm and luxurious fragrance featuring rich amber, soft woods, and subtle sweetness.',
    description: 'Amber Prime Extrait de Parfum is a refined and sensual scent built around deep amber notes. It opens smoothly and transitions into a warm, slightly sweet heart with woody undertones. The base is rich, comforting, and long-lasting, making it an excellent signature fragrance. Ideal for evenings, cooler weather, and those who enjoy elegant, mature scents.',
    category: 'Fresh & Daily Sourced',
    gender: 'Unisex',
    originalPrice: 1499,
    price: 899,
    stockQuantity: 50,
  },
];

async function login() {
  try {
    const response = await fetch(`${API_BASE}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    const data = await response.json();
    if (data.success && data.data.token) {
      return data.data.token;
    }
    throw new Error(data.message || 'Login failed');
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

async function createProduct(token, productData, imageFiles = []) {
  try {
    const formData = new FormData();
    
    // Add product data as JSON
    const productPayload = {
      name: productData.name,
      shortDescription: productData.shortDescription,
      description: productData.description,
      category: productData.category,
      gender: productData.gender,
      sizes: [{
        size: '120ML',
        price: productData.price,
        originalPrice: productData.originalPrice,
        stockQuantity: productData.stockQuantity,
      }],
      active: true,
    };

    formData.append('productData', JSON.stringify(productPayload));

    // Add image files if provided
    if (imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        if (fs.existsSync(imageFile)) {
          formData.append('images', fs.createReadStream(imageFile));
        }
      }
    }

    const response = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.data.product;
    }
    throw new Error(data.message || 'Product creation failed');
  } catch (error) {
    console.error('Create product error:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔐 Logging in...');
  const token = await login();
  console.log('✅ Login successful\n');

  // Check if category exists, create if needed
  console.log('📦 Creating products...\n');

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`Creating product ${i + 1}/8: ${product.name.substring(0, 50)}...`);
    
    try {
      // Note: Images would need to be provided as file paths
      // For now, creating without images (can be added later via admin panel)
      const created = await createProduct(token, product);
      console.log(`✅ Created: ${created.name}`);
      console.log(`   ID: ${created._id}\n`);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`);
    }
  }

  console.log('✨ Done!');
}

main().catch(console.error);

