import Product from '../models/Product.js';

/**
 * Get all products with filters
 * @route GET /api/products
 */
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      gender,
      minPrice,
      maxPrice,
      minRating,
      tag,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query - only show active products to customers
    // NOTE: We don't filter by inStock here because:
    // 1. inStock might be calculated from sizes array
    // 2. We want to show products even if temporarily out of stock (with "Out of Stock" badge)
    // 3. Stock calculation happens after fetching products
    const query = {
      active: true,
    };

    if (category) query.category = category;
    if (gender) query.gender = gender;
    if (tag) query.tag = tag;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const products = await Product.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Calculate inStock from sizes array if present, or from stockQuantity
    const productsWithCalculatedStock = products.map(product => {
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        // Product is in stock if any size is in stock
        product.inStock = product.sizes.some(size => size.inStock !== false && (size.stockQuantity || 0) > 0);
        // Also calculate total stockQuantity from sizes
        product.stockQuantity = product.sizes.reduce((sum, size) => sum + (size.stockQuantity || 0), 0);
      } else {
        // For single-size products, use product-level stockQuantity
        // inStock is true if stockQuantity > 0 OR if inStock is explicitly true
        if (product.inStock === undefined) {
          product.inStock = (product.stockQuantity || 0) > 0;
        }
      }
      return product;
    });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products: productsWithCalculatedStock,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * Get single product by ID
 * @route GET /api/products/:id
 */
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Calculate inStock from sizes array if present, or from stockQuantity
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      // Product is in stock if any size is in stock
      product.inStock = product.sizes.some(size => size.inStock !== false && (size.stockQuantity || 0) > 0);
      // Also calculate total stockQuantity from sizes
      product.stockQuantity = product.sizes.reduce((sum, size) => sum + (size.stockQuantity || 0), 0);
    } else {
      // For single-size products, use product-level stockQuantity
      if (product.inStock === undefined) {
        product.inStock = (product.stockQuantity || 0) > 0;
      }
    }

    // Only show active products to customers (admin can view all via admin route)
    // NOTE: We show products even if out of stock (inStock: false) so users can see them with "Out of Stock" badge
    if (!product.active) {
      return res.status(404).json({
        success: false,
        message: 'Product not available',
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

