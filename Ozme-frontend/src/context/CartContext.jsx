import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiRequest } from '../utils/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Transform backend cart item to frontend format
  const transformBackendItem = (item) => {
    const product = item.product || item;
    return {
      id: product._id || product.id,
      name: product.name,
      category: product.category || product.gender || 'Unisex',
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images?.[0] || product.image || '',
      quantity: item.quantity || 1,
      size: item.size || '120ml',
      _id: item._id, // Keep backend ID for updates/deletes
    };
  };

  // Load cart from backend API
  const loadCartFromBackend = useCallback(async () => {
    try {
      const response = await apiRequest('/cart');
      if (response && response.success && response.data) {
        const backendItems = response.data.items || [];
        const transformedItems = backendItems.map(transformBackendItem);
        setCart(transformedItems);
        // Sync to localStorage
        localStorage.setItem('ozmeCart', JSON.stringify(transformedItems));
        return transformedItems;
      }
      return [];
    } catch (error) {
      console.error('Error loading cart from backend:', error);
      return null; // Return null to indicate failure
    }
  }, []);

  // Load cart from localStorage (fallback)
  const loadCartFromLocalStorage = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('ozmeCart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    return [];
  }, []);

  // Load cart on mount - try backend first, fallback to localStorage
  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      
      // Try backend first
      const backendCart = await loadCartFromBackend();
      
      if (backendCart !== null) {
        // Backend loaded successfully
        setCart(backendCart);
      } else {
        // Backend failed, use localStorage
        const localCart = loadCartFromLocalStorage();
        setCart(localCart);
        
        // Try to sync localStorage to backend in background
        if (localCart.length > 0) {
          syncLocalCartToBackend(localCart);
        }
      }
      
      setLoading(false);
    };

    initializeCart();
  }, [loadCartFromBackend, loadCartFromLocalStorage]);

  // Sync localStorage cart to backend (for recovery)
  const syncLocalCartToBackend = async (localCart) => {
    if (isSyncing || !localCart || localCart.length === 0) return;
    
    setIsSyncing(true);
    try {
      // Add each item from localStorage to backend
      for (const item of localCart) {
        try {
          await apiRequest('/cart', {
            method: 'POST',
            body: JSON.stringify({
              productId: item.id,
              quantity: item.quantity || 1,
              size: item.size || '120ml',
            }),
          });
        } catch (error) {
          console.error('Error syncing cart item to backend:', error);
        }
      }
      
      // Reload from backend to get the merged cart
      await loadCartFromBackend();
    } catch (error) {
      console.error('Error syncing cart to backend:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('ozmeCart', JSON.stringify(cart));
    }
  }, [cart, loading]);

  const removeFromCart = useCallback(async (id, size = null) => {
    // Dismiss any existing cart toast to prevent duplicates
    toast.dismiss('cart-remove-toast');
    
    // Find the item to remove
    const itemToRemove = cart.find((item) => {
      if (size !== null) {
        return item.id === id && item.size === size;
      }
      return item.id === id;
    });

    // Optimistic update - remove from local state immediately
    setCart((prevCart) => {
      if (size !== null) {
        return prevCart.filter((item) => !(item.id === id && item.size === size));
      } else {
        return prevCart.filter((item) => item.id !== id);
      }
    });

    // Show toast
    if (itemToRemove) {
      toast.success(`${itemToRemove.name}${itemToRemove.size ? ` (${itemToRemove.size})` : ''} removed from cart`, { id: 'cart-remove-toast' });
    }

    // Try to remove from backend
    if (itemToRemove?._id) {
      try {
        await apiRequest(`/cart/${itemToRemove._id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error removing item from backend cart:', error);
        // Item already removed from local state, so we continue
      }
    } else {
      // No backend ID, try to find and remove by productId
      try {
        await apiRequest(`/cart/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error removing item from backend cart:', error);
      }
    }
  }, [cart]);

  const addToCart = useCallback(async (product, quantity = 1, size = null, sizePrice = null) => {
    // Prevent multiple simultaneous adds
    if (addingToCart) return;
    
    setAddingToCart(true);
    
    try {
    // Dismiss any existing cart toast to prevent duplicates
    toast.dismiss('cart-add-toast');
      
      // Ensure quantity is at least 1
      const qty = Math.max(1, quantity);
    
    // Normalize product ID (handle both id and _id)
    const productId = product.id || product._id;
    if (!productId) {
      toast.error('Invalid product. Please try again.', { id: 'cart-add-toast' });
      return;
    }
    
    // Normalize size (default to first available size or '120ML')
    let normalizedSize = size;
    if (!normalizedSize && product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      normalizedSize = product.sizes[0].value || product.sizes[0].size || '120ML';
    }
    normalizedSize = normalizedSize || '120ML';
    
    // Determine the price to use
    let itemPrice = sizePrice;
    let itemOriginalPrice = product.originalPrice || product.price;
    
    if (product.sizes && Array.isArray(product.sizes) && normalizedSize) {
      const sizeObj = product.sizes.find(s => 
        (s.value === normalizedSize || s.size === normalizedSize) ||
        (s.value?.toUpperCase() === normalizedSize.toUpperCase() || s.size?.toUpperCase() === normalizedSize.toUpperCase())
      );
      if (sizeObj) {
        itemPrice = sizeObj.price;
        itemOriginalPrice = sizeObj.originalPrice || sizeObj.price;
        
        // Check stock availability
        const stockQty = sizeObj.stockQuantity || 0;
        const inStock = sizeObj.inStock !== undefined ? sizeObj.inStock : (stockQty > 0);
        
        if (!inStock || stockQty === 0) {
          toast.error(`Size ${normalizedSize} is out of stock`, { id: 'cart-add-toast' });
          return;
        }
        
        // Check if adding quantity exceeds stock
        const existingItem = cart.find(
          (item) => (item.id === productId || item.id?.toString() === productId?.toString()) && 
                    (item.size === normalizedSize || item.size?.toUpperCase() === normalizedSize.toUpperCase())
        );
        const currentQty = existingItem ? existingItem.quantity : 0;
        if (currentQty + qty > stockQty) {
          toast.error(`Only ${stockQty} items available in stock for ${normalizedSize}`, { id: 'cart-add-toast' });
          return;
        }
      }
    }
    
    // Fallback to product price if size price not found
    if (itemPrice === null || itemPrice === undefined) {
      itemPrice = product.price;
    }

    // Check if product already exists in cart (same product ID and same size)
    const existingItemIndex = cart.findIndex(
      (item) => (item.id === productId || item.id?.toString() === productId?.toString()) && 
                (item.size === normalizedSize || item.size?.toUpperCase() === normalizedSize.toUpperCase())
    );

    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const existingItem = cart[existingItemIndex];
      const newQuantity = existingItem.quantity + qty;
      
      // Optimistic update
      setCart((prevCart) => {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = { ...updatedCart[existingItemIndex], quantity: newQuantity };
        return updatedCart;
      });

      toast.success(`Cart updated`, { id: 'cart-add-toast' });

      // Update backend
      if (existingItem._id) {
        try {
          await apiRequest(`/cart/${existingItem._id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              quantity: newQuantity,
            }),
          });
        } catch (error) {
          console.error('Error updating cart item in backend:', error);
          toast.error('Failed to update cart. Please try again.', { id: 'cart-add-toast' });
          // Reload from backend to sync
          await loadCartFromBackend();
        }
      }
    } else {
      // Add new product to cart
      const newItem = {
        id: productId,
        name: product.name,
        category: product.category || product.gender || 'Unisex',
        price: itemPrice,
        originalPrice: itemOriginalPrice,
        image: product.images?.[0] || product.image || '',
        quantity: qty,
        size: normalizedSize
      };

      // Optimistic update
      setCart((prevCart) => [...prevCart, newItem]);
      toast.success(`Added to cart`, { id: 'cart-add-toast' });

      // Add to backend
      try {
        const response = await apiRequest('/cart', {
          method: 'POST',
          body: JSON.stringify({
            productId: productId.toString(),
            quantity: qty,
            size: normalizedSize,
          }),
        });

        if (response && response.success) {
          // Reload from backend to get the actual item with _id
          await loadCartFromBackend();
        } else {
          throw new Error(response?.message || 'Failed to add to cart');
        }
      } catch (error) {
        console.error('Error adding item to backend cart:', error);
        toast.error('Failed to add to cart. Please try again.', { id: 'cart-add-toast' });
        // Revert optimistic update on error
        setCart((prevCart) => prevCart.filter(item => 
          !(item.id === productId && item.size === normalizedSize)
        ));
      }
    }
    } finally {
      setAddingToCart(false);
    }
  }, [cart, loadCartFromBackend, addingToCart]);

  const updateQuantity = useCallback(async (id, newQuantity, size = null) => {
    if (newQuantity < 1) {
      // Remove item if quantity is 0
      if (size !== null) {
        await removeFromCart(id, size);
      } else {
        await removeFromCart(id);
      }
      return;
    }

    // Find the item
    const itemIndex = cart.findIndex((item) => {
      if (size !== null) {
        return item.id === id && item.size === size;
      }
      return item.id === id;
    });

    if (itemIndex >= 0) {
      const item = cart[itemIndex];
      
      // Optimistic update
      setCart((prevCart) => {
        if (size !== null) {
          return prevCart.map((item) =>
            item.id === id && item.size === size ? { ...item, quantity: newQuantity } : item
          );
        } else {
          const updatedCart = [...prevCart];
          updatedCart[itemIndex] = { ...updatedCart[itemIndex], quantity: newQuantity };
          return updatedCart;
        }
      });

      // Update backend
      if (item._id) {
        try {
          await apiRequest(`/cart/${item._id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              quantity: newQuantity,
            }),
          });
        } catch (error) {
          console.error('Error updating cart item quantity in backend:', error);
          // Reload from backend to sync
          await loadCartFromBackend();
        }
      }
    }
  }, [cart, removeFromCart, loadCartFromBackend]);

  const clearCart = useCallback(async () => {
    // Optimistic update
    setCart([]);
    localStorage.removeItem('ozmeCart');

    // Clear backend cart
    try {
      await apiRequest('/cart', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error clearing backend cart:', error);
    }
  }, []);

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    loading,
    isSyncing,
    addingToCart,
    refreshCart: loadCartFromBackend, // Expose refresh function
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};



