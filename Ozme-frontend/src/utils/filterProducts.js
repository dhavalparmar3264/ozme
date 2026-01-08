/**
 * Filters products based on search query
 * @param {Array} products - Array of product objects
 * @param {string} query - Search query string
 * @returns {Array} - Filtered array of products
 */
export const filterProducts = (products, query) => {
  // If no query, return all products
  if (!query || query.trim() === '') {
    return products;
  }

  // Normalize query to lowercase for case-insensitive search
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter(product => {
    // Search in product name
    const nameMatch = product.name?.toLowerCase().includes(normalizedQuery);
    
    // Search in product description
    const descriptionMatch = product.description?.toLowerCase().includes(normalizedQuery);
    
    // Search in product category
    const categoryMatch = product.category?.toLowerCase().includes(normalizedQuery);
    
    // Search in product brand (if exists)
    const brandMatch = product.brand?.toLowerCase().includes(normalizedQuery);
    
    // Search in product highlights (if exists)
    const highlightsMatch = product.highlights?.some(highlight => 
      highlight.toLowerCase().includes(normalizedQuery)
    );
    
    // Search in fragrance notes (if exists)
    const notesMatch = product.notes ? (
      product.notes.top?.toLowerCase().includes(normalizedQuery) ||
      product.notes.heart?.toLowerCase().includes(normalizedQuery) ||
      product.notes.base?.toLowerCase().includes(normalizedQuery)
    ) : false;

    // Return true if any field matches
    return nameMatch || descriptionMatch || categoryMatch || brandMatch || highlightsMatch || notesMatch;
  });
};

