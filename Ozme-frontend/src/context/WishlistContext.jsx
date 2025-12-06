import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiRequest } from '../utils/api';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Transform backend wishlist item to frontend format
  const transformBackendItem = (item) => {
    const product = item.product || item;
    return {
      id: product._id || product.id,
      name: product.name,
      category: product.category || product.gender || 'Unisex',
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images?.[0] || product.image || '',
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      tag: product.tag || (product.bestseller ? 'Bestseller' : null),
      _id: item._id, // Keep backend ID for reference
    };
  };

  // Load wishlist from backend API
  const loadWishlistFromBackend = useCallback(async () => {
    try {
      const response = await apiRequest('/wishlist');
      if (response && response.success && response.data) {
        const backendItems = response.data.items || [];
        const transformedItems = backendItems.map(transformBackendItem);
        setWishlist(transformedItems);
        // Sync to localStorage
        localStorage.setItem('ozmeWishlist', JSON.stringify(transformedItems));
        return transformedItems;
      }
      return [];
    } catch (error) {
      console.error('Error loading wishlist from backend:', error);
      return null; // Return null to indicate failure
    }
  }, []);

  // Load wishlist from localStorage (fallback)
  const loadWishlistFromLocalStorage = useCallback(() => {
    try {
      const savedWishlist = localStorage.getItem('ozmeWishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
    }
    return [];
  }, []);

  // Load wishlist on mount - try backend first, fallback to localStorage
  useEffect(() => {
    const initializeWishlist = async () => {
      setLoading(true);
      
      // Try backend first
      const backendWishlist = await loadWishlistFromBackend();
      
      if (backendWishlist !== null) {
        // Backend loaded successfully
        setWishlist(backendWishlist);
      } else {
        // Backend failed, use localStorage
        const localWishlist = loadWishlistFromLocalStorage();
        setWishlist(localWishlist);
        
        // Try to sync localStorage to backend in background
        if (localWishlist.length > 0) {
          syncLocalWishlistToBackend(localWishlist);
        }
      }
      
      setLoading(false);
    };

    initializeWishlist();
    
    // Listen for storage events to sync across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'ozmeWishlist') {
        const localWishlist = loadWishlistFromLocalStorage();
        setWishlist(localWishlist);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadWishlistFromBackend, loadWishlistFromLocalStorage]);

  // Sync localStorage wishlist to backend (for recovery)
  const syncLocalWishlistToBackend = async (localWishlist) => {
    if (isSyncing || !localWishlist || localWishlist.length === 0) return;
    
    setIsSyncing(true);
    try {
      // Add each item from localStorage to backend
      for (const item of localWishlist) {
        try {
          await apiRequest('/wishlist', {
            method: 'POST',
            body: JSON.stringify({
              productId: item.id,
            }),
          });
        } catch (error) {
          // Item might already exist, that's okay
          console.error('Error syncing wishlist item to backend:', error);
        }
      }
      
      // Reload from backend to get the merged wishlist
      await loadWishlistFromBackend();
    } catch (error) {
      console.error('Error syncing wishlist to backend:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('ozmeWishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, loading]);

  const addToWishlist = useCallback(async (product) => {
    // Dismiss any existing wishlist toast to prevent duplicates
    toast.dismiss('wishlist-add-toast');
    
    // Check if product already exists in wishlist
    const exists = wishlist.some((item) => item.id === product.id);
    
    if (exists) {
      // Product already in wishlist
      toast.success(`${product.name} is already in your wishlist!`, { id: 'wishlist-add-toast' });
      return;
    }

    // Add new product to wishlist
    const newItem = {
      id: product.id,
      name: product.name,
      category: product.category || product.gender || 'Unisex',
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images?.[0] || product.image || '',
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      tag: product.tag || (product.bestseller ? 'Bestseller' : null)
    };

    // Optimistic update
    setWishlist((prevWishlist) => [...prevWishlist, newItem]);
    toast.success(`${product.name} added to wishlist!`, { id: 'wishlist-add-toast' });

    // Add to backend
    try {
      const response = await apiRequest('/wishlist', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
        }),
      });

      if (response && response.success) {
        // Reload from backend to get the actual item with _id
        await loadWishlistFromBackend();
      }
    } catch (error) {
      console.error('Error adding item to backend wishlist:', error);
      // Item already added to local state, so we continue
      // Will sync on next page load
    }
  }, [wishlist, loadWishlistFromBackend]);

  const removeFromWishlist = useCallback(async (id) => {
    // Dismiss any existing wishlist toast to prevent duplicates
    toast.dismiss('wishlist-remove-toast');
    
    // Find the item to remove
    const itemToRemove = wishlist.find((item) => item.id === id);

    // Optimistic update - remove from local state immediately
    setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== id));

    // Show toast
    if (itemToRemove) {
      toast.success(`${itemToRemove.name} removed from wishlist`, { id: 'wishlist-remove-toast' });
    }

    // Try to remove from backend
    try {
      await apiRequest(`/wishlist/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error removing item from backend wishlist:', error);
      // Item already removed from local state, so we continue
    }
  }, [wishlist]);

  const toggleWishlist = useCallback(async (product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    
    if (exists) {
      // Remove from wishlist
      await removeFromWishlist(product.id);
    } else {
      // Add to wishlist
      await addToWishlist(product);
    }
  }, [wishlist, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some((item) => item.id === productId);
  }, [wishlist]);

  const clearWishlist = useCallback(async () => {
    // Optimistic update
    const itemsToRemove = [...wishlist];
    setWishlist([]);
    localStorage.removeItem('ozmeWishlist');

    // Clear backend wishlist (remove all items)
    try {
      // Remove each item from backend
      for (const item of itemsToRemove) {
        try {
          await apiRequest(`/wishlist/${item.id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.error('Error removing wishlist item from backend:', error);
        }
      }
    } catch (error) {
      console.error('Error clearing backend wishlist:', error);
    }
  }, [wishlist]);

  const getWishlistCount = useCallback(() => {
    return wishlist.length;
  }, [wishlist]);

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    getWishlistCount,
    loading,
    isSyncing,
    refreshWishlist: loadWishlistFromBackend, // Expose refresh function
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
