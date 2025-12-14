import { Plus, Edit, Trash2, Search, Package, TrendingUp, AlertCircle, Filter, ArrowLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest('/admin/products');
      
      if (response && response.success) {
        // Transform backend products to match frontend format
        const transformedProducts = response.data.products.map(product => ({
          id: product._id,
          _id: product._id,
          name: product.name,
          sku: product._id.slice(-8).toUpperCase(), // Use last 8 chars of ID as SKU
          category: product.category,
          brand: 'OZME', // Default brand
          price: product.price,
          originalPrice: product.originalPrice || product.price,
          discount: product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
          stock: product.stockQuantity || 0,
          sizes: product.sizes || [], // Include sizes array
          status: !product.active ? 'Out of Stock' : (product.stockQuantity < 20 ? 'Low Stock' : 'Active'),
          image: product.images?.[0] || '',
          images: product.images || [],
          description: product.description,
          gender: product.gender,
          inStock: product.inStock,
          active: product.active,
        }));
        setProducts(transformedProducts);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await apiRequest(`/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response && response.success) {
        setProducts(products.filter(p => p.id !== productId && p._id !== productId));
      } else {
        alert(response?.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      'Out of Stock': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

  // Stats calculation
  const stats = {
    total: products.length,
    lowStock: products.filter(p => (p.stock || 0) < 20 && p.active).length,
    totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0)
  };

  const handleSave = async (savedProduct) => {
    // Refresh products list after save
    await fetchProducts();
    setShowAddForm(false);
    setEditingProduct(null);
  };

  if (showAddForm) {
    return <AddProductForm 
      onBack={() => {
        setShowAddForm(false);
        setEditingProduct(null);
      }} 
      editingProduct={editingProduct}
      onSave={handleSave}
    />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && products.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Product <span className="font-serif italic text-amber-600">Catalog</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">Manage your product inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-amber-100/20 dark:border-amber-900/20 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-700 transition-all">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter</span>
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-semibold">Add Product</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-6 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Products</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.total}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-6 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500 to-pink-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Low Stock Items</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.lowStock}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Inventory Value</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">${stats.totalValue.toLocaleString()}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name, category, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-0 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-transparent text-gray-800 dark:text-white rounded-xl"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
          <h2 className="text-xl font-light text-gray-900 dark:text-white">
            All <span className="font-serif italic">Products</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50/50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/20 dark:divide-amber-900/20">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover shadow-sm"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{product.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{product.sku || product._id?.slice(-8).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {product.gender || 'Unisex'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    {product.sizes && product.sizes.length > 1 ? (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Multiple sizes</div>
                        <div>From ₹{Math.min(...product.sizes.map(s => s.price)).toLocaleString('en-IN')}</div>
                      </div>
                    ) : (
                      `₹${product.price?.toLocaleString('en-IN') || '0'}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {product.discount > 0 ? `${product.discount}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {product.sizes && product.sizes.length > 1 ? (
                      <div className="text-xs">
                        <div className="font-semibold">{product.sizes.length} sizes</div>
                        <div className="text-gray-500">Total: {product.sizes.reduce((sum, s) => sum + (s.stockQuantity || 0), 0)}</div>
                      </div>
                    ) : (
                      <span className={(product.stock || 0) < 20 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                        {product.stock || 0}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product._id || product.id)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Add/Edit Product Form Component
const AddProductForm = ({ onBack, editingProduct, onSave }) => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageInputs, setImageInputs] = useState([0]); // Track file input fields (up to 10)
  const [selectedFiles, setSelectedFiles] = useState([]); // Store File objects
  const [filePreviews, setFilePreviews] = useState([]); // Store preview URLs
  const [formData, setFormData] = useState(() => {
    if (editingProduct) {
      // If product has sizes array, use it; otherwise convert single size to array format
      let sizes = [];
      if (editingProduct.sizes && Array.isArray(editingProduct.sizes) && editingProduct.sizes.length > 0) {
        sizes = editingProduct.sizes.map(s => ({
          size: s.size || '100ML',
          price: s.price || '',
          originalPrice: s.originalPrice || '',
          stockQuantity: s.stockQuantity || 0,
        }));
      } else {
        // Convert single size to array format for backward compatibility
        sizes = [{
          size: editingProduct.size || '100ML',
          price: editingProduct.price || '',
          originalPrice: editingProduct.originalPrice || '',
          stockQuantity: editingProduct.stockQuantity || 0,
        }];
      }
      
      return {
        name: editingProduct.name || '',
        shortDescription: editingProduct.shortDescription || '',
        description: editingProduct.description || '',
        category: editingProduct.category || '',
        gender: editingProduct.gender || 'Unisex',
        tag: editingProduct.tag || '',
        sizes: sizes,
        images: editingProduct.images || (editingProduct.image ? [editingProduct.image] : []),
        active: editingProduct.active !== undefined ? editingProduct.active : true,
      };
    } else {
      return {
        name: '',
        shortDescription: '',
        description: '',
        category: '',
        gender: 'Unisex',
        tag: '',
        sizes: [{ size: '100ML', price: '', originalPrice: '', stockQuantity: 0 }],
        images: [],
        active: true,
      };
    }
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await apiRequest('/admin/categories');
        if (response && response.success) {
          setCategories(response.data.categories.filter(cat => cat.active));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileSelect = (index, files) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Take first file if multiple selected
    const totalFiles = selectedFiles.length + 1;
    
    if (totalFiles > 10) {
      alert('Maximum 10 images allowed. Please remove some images first.');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Add file and preview
    const newFiles = [...selectedFiles, file];
    const newPreviews = [...filePreviews, previewUrl];

    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);

    // Clear the input
    const input = document.getElementById(`image-input-${index}`);
    if (input) input.value = '';
  };

  const removeFile = (index) => {
    // Revoke preview URL to free memory
    URL.revokeObjectURL(filePreviews[index]);
    
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const addImageInput = () => {
    if (imageInputs.length < 10 && selectedFiles.length < 10) {
      setImageInputs([...imageInputs, imageInputs.length]);
    }
  };

  const removeImageInput = (index) => {
    if (imageInputs.length > 1) {
      setImageInputs(imageInputs.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.description || !formData.category || !formData.gender) {
      alert('Please fill in all required fields (Name, Description, Category, Gender)');
      return;
    }

    // Validate sizes array
    if (!formData.sizes || formData.sizes.length === 0) {
      alert('Please add at least one product size');
      return;
    }

    // Validate each size
    for (let i = 0; i < formData.sizes.length; i++) {
      const sizeItem = formData.sizes[i];
      if (!sizeItem.size || !sizeItem.price || sizeItem.stockQuantity === '' || sizeItem.stockQuantity === undefined) {
        alert(`Please fill in all fields for Size #${i + 1} (Size, Price, Stock Quantity)`);
        return;
      }
      
      if (!sizeItem.originalPrice) {
        alert(`Please enter MRP for Size #${i + 1}`);
        return;
      }

      if (parseFloat(sizeItem.originalPrice) < parseFloat(sizeItem.price)) {
        alert(`MRP must be greater than or equal to Selling Price for Size #${i + 1} (${sizeItem.size})`);
        return;
      }
    }

    // Check for images (either selected files or existing images for editing)
    const hasNewImages = selectedFiles.length > 0;
    const hasExistingImages = editingProduct && formData.images && formData.images.length > 0;
    
    if (!hasNewImages && !hasExistingImages) {
      alert('Please select at least one product image');
      return;
    }

    if (selectedFiles.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    if (formData.shortDescription && formData.shortDescription.length > 200) {
      alert('Short description cannot exceed 200 characters');
      return;
    }

    setUploadingImages(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add product data as JSON string (except images)
      const productData = {
        name: formData.name,
        shortDescription: formData.shortDescription || undefined,
        description: formData.description,
        category: formData.category,
        gender: formData.gender,
        tag: formData.tag || undefined,
        sizes: formData.sizes.map(sizeItem => ({
          size: sizeItem.size,
          price: parseFloat(sizeItem.price),
          originalPrice: parseFloat(sizeItem.originalPrice),
          stockQuantity: parseInt(sizeItem.stockQuantity) || 0,
        })),
        active: formData.active,
      };

      // Add existing images if editing
      if (editingProduct && formData.images && formData.images.length > 0) {
        productData.existingImages = formData.images;
      }

      formDataToSend.append('productData', JSON.stringify(productData));

      // Add selected files
      selectedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      // Send request
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://82.112.231.165:3002/api'}/admin/products${editingProduct ? `/${editingProduct._id}` : ''}`;
      const response = await fetch(apiUrl, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data && data.success) {
        alert(`Product ${editingProduct ? 'updated' : 'created'} successfully!`);
        // Clean up preview URLs
        filePreviews.forEach(url => URL.revokeObjectURL(url));
        await onSave(data.data.product);
      } else {
        alert(data?.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }
    } catch (err) {
      console.error(`Error ${editingProduct ? 'updating' : 'creating'} product:`, err);
      alert(err.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            {editingProduct ? 'Edit' : 'Add New'} <span className="font-serif italic text-amber-600">Product</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">
            {editingProduct ? 'Update product information' : 'Create a new product in your catalog'}
          </p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-amber-100/20 dark:border-amber-900/20 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Back to Products</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Basic <span className="font-serif italic">Information</span>
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter product name"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select 
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={loadingCategories}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white disabled:opacity-50"
                >
                  <option value="">{loadingCategories ? 'Loading categories...' : 'Select Category'}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name} {cat.description ? `- ${cat.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sizes Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Product Sizes * (Add at least one size)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      // Find the first available size that's not already used
                      const allSizes = ['50ML', '100ML', '150ML', '200ML', '250ML', '300ML'];
                      const usedSizes = formData.sizes.map(s => s.size);
                      const availableSize = allSizes.find(size => !usedSizes.includes(size)) || allSizes[0];
                      
                      const newSizes = [...formData.sizes, { 
                        size: availableSize, 
                        price: '', 
                        originalPrice: '', 
                        stockQuantity: 0 
                      }];
                      setFormData({ ...formData, sizes: newSizes });
                    }}
                    disabled={formData.sizes.length >= 6}
                    className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add Size
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.sizes.map((sizeItem, index) => {
                    const discountPercent = sizeItem.originalPrice && sizeItem.price
                      ? Math.round(((parseFloat(sizeItem.originalPrice) - parseFloat(sizeItem.price)) / parseFloat(sizeItem.originalPrice)) * 100)
                      : 0;
                    
                    // Get available sizes (exclude already used sizes except current one)
                    const usedSizes = formData.sizes.map((s, i) => i !== index ? s.size : null).filter(Boolean);
                    const availableSizes = ['50ML', '100ML', '150ML', '200ML', '250ML', '300ML'].filter(
                      size => !usedSizes.includes(size) || size === sizeItem.size
                    );

                    return (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Size #{index + 1}
                          </span>
                          {formData.sizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newSizes = formData.sizes.filter((_, i) => i !== index);
                                setFormData({ ...formData, sizes: newSizes });
                              }}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Size *
                            </label>
                            <select
                              value={sizeItem.size}
                              onChange={(e) => {
                                const newSizes = [...formData.sizes];
                                newSizes[index].size = e.target.value;
                                setFormData({ ...formData, sizes: newSizes });
                              }}
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm"
                            >
                              {availableSizes.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              MRP (₹) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={sizeItem.originalPrice}
                              onChange={(e) => {
                                const newSizes = [...formData.sizes];
                                newSizes[index].originalPrice = e.target.value;
                                setFormData({ ...formData, sizes: newSizes });
                              }}
                              placeholder="0.00"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Selling Price (₹) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={sizeItem.price}
                              onChange={(e) => {
                                const newSizes = [...formData.sizes];
                                newSizes[index].price = e.target.value;
                                setFormData({ ...formData, sizes: newSizes });
                              }}
                              placeholder="0.00"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm"
                            />
                            {discountPercent > 0 && (
                              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                {discountPercent}% off
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Stock Quantity *
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={sizeItem.stockQuantity}
                              onChange={(e) => {
                                const newSizes = [...formData.sizes];
                                newSizes[index].stockQuantity = parseInt(e.target.value) || 0;
                                setFormData({ ...formData, sizes: newSizes });
                              }}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tag Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tag
                </label>
                <select
                  value={formData.tag}
                  onChange={(e) => handleChange('tag', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                >
                  <option value="">Select Tag (Optional)</option>
                  <option value="Bestseller">Bestseller</option>
                  <option value="New">New</option>
                  <option value="Limited">Limited</option>
                </select>
              </div>

              {/* Gender Radio Buttons */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Gender *
                </label>
                <div className="flex gap-6">
                  {['Men', 'Women', 'Unisex'].map((gender) => (
                    <label key={gender} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={formData.gender === gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>


              {/* Short Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Short Description
                  <span className="ml-2 text-xs text-gray-500">
                    ({formData.shortDescription?.length || 0}/200 characters)
                  </span>
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => handleChange('shortDescription', e.target.value)}
                  placeholder="Brief product description for product cards (max 200 characters)"
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white resize-none"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detailed product description"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white resize-none"
                />
              </div>

              {/* Product Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Product Images * (Up to 10 images)
                </label>
                <div className="space-y-3">
                  {/* Multiple file inputs */}
                  {imageInputs.map((inputIndex, idx) => (
                    <div key={inputIndex} className="flex items-center gap-2">
                      <input
                        id={`image-input-${inputIndex}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(inputIndex, e.target.files)}
                        disabled={uploadingImages || selectedFiles.length >= 10}
                        className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white disabled:opacity-50 text-sm"
                      />
                      {imageInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageInput(idx)}
                          className="px-3 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                          title="Remove this input"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Add More button */}
                  {imageInputs.length < 10 && selectedFiles.length < 10 && (
                    <button
                      type="button"
                      onClick={addImageInput}
                      disabled={uploadingImages}
                      className="w-full px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                    >
                      + Add More
                    </button>
                  )}

                  {/* Show existing images if editing */}
                  {editingProduct && formData.images && formData.images.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Images:</p>
                      <div className="grid grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img
                              src={image}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-24 object-cover rounded-xl shadow-sm"
                            />
                            <span className="absolute bottom-1 left-1 px-2 py-1 text-xs bg-blue-500 text-white rounded">
                              Existing
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show selected file previews */}
                  {filePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selected Images ({selectedFiles.length}/10):
                      </p>
                      <div className="grid grid-cols-4 gap-4">
                        {filePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Selected ${index + 1}`}
                              className="w-full h-24 object-cover rounded-xl shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 px-2 py-1 text-xs bg-green-500 text-white rounded">
                              New
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFiles.length === 0 && (!editingProduct || !formData.images || formData.images.length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No images selected yet</p>
                  )}

                  {uploadingImages && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        ⏳ Creating product and uploading images...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-amber-900/20 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-amber-100/20 dark:border-amber-900/20">
              <h2 className="text-xl font-light text-gray-900 dark:text-white">
                Product <span className="font-serif italic">Status</span>
              </h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select 
                value={formData.active ? 'Active' : 'Inactive'}
                onChange={(e) => handleChange('active', e.target.value === 'Active')}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleSave}
              disabled={uploadingImages}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImages ? 'Processing...' : (editingProduct ? 'Update Product' : 'Create Product')}
            </button>
            <button 
              onClick={onBack}
              className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-amber-100/20 dark:border-amber-900/20 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-amber-50 dark:hover:bg-gray-700 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;