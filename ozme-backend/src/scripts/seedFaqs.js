import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Faq from '../models/Faq.js';
import connectDB from '../config/db.js';

dotenv.config();

const faqs = [
  {
    question: 'Are OZME perfumes long-lasting?',
    answer: 'Yes, our perfumes are crafted with high-quality Eau de Parfum (EDP) concentration, giving 8–12 hours of long-lasting performance.',
    order: 1,
  },
  {
    question: 'Are the fragrance oils imported from France?',
    answer: 'Yes, our premium fragrance oils are sourced from France and the Middle East for authentic luxury scents.',
    order: 2,
  },
  {
    question: 'Are your perfumes inspired by international brands?',
    answer: 'Yes, our fragrances are inspired by top global designer perfumes but crafted uniquely for the Indian climate.',
    order: 3,
  },
  {
    question: 'What is the concentration level of your perfumes?',
    answer: 'All OZME perfumes are EDP (Eau de Parfum) with 20–30% perfume oil concentration.',
    order: 4,
  },
  {
    question: 'Is the perfume safe for skin?',
    answer: 'Absolutely. Our perfumes are dermatologically tested and free from harmful chemicals.',
    order: 5,
  },
  {
    question: 'What is the shelf life?',
    answer: 'Our perfumes have a shelf life of 36 months from the date of manufacture.',
    order: 6,
  },
  {
    question: 'How should I store my perfume?',
    answer: 'Store in a cool, dry place away from direct sunlight to maintain longevity.',
    order: 7,
  },
  {
    question: 'Does it perform well in hot weather?',
    answer: 'Yes, our formulas are optimized for Indian weather—hot, humid, or dry.',
    order: 8,
  },
  {
    question: 'Are the perfumes unisex?',
    answer: "We offer Men's, Women's, and Unisex collections.",
    order: 9,
  },
  {
    question: 'Do you offer Cash on Delivery?',
    answer: 'Yes, COD is available across India.',
    order: 10,
  },
];

const seedFaqs = async () => {
  try {
    await connectDB();

    // Clear existing FAQs
    await Faq.deleteMany({});

    // Insert FAQs
    await Faq.insertMany(faqs);

    console.log('✅ FAQs seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding FAQs:', error);
    process.exit(1);
  }
};

// Only run if explicitly called (not auto-run on import)
// Usage: node src/scripts/seedFaqs.js
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFaqs();
}

