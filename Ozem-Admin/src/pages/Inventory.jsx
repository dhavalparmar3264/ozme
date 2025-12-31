import { Plus, AlertTriangle, Package, TrendingUp, TrendingDown, Warehouse, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-blue-100/20 dark:border-blue-900/20">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-light text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          <div className="px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [operation, setOperation] = useState('add'); // 'add' or 'set'
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Fetch products from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest('/admin/products?limit=1000');
      
      if (response && response.success) {
        const products = response.data.products || [];
        setInventoryData(products);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStockModal = (product, sizeIndex = null) => {
    setSelectedProduct(product);
    setSelectedSizeIndex(sizeIndex);
    setQuantity('');
    setOperation('add');
    setReason('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct || quantity === '' || parseInt(quantity) < 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      setUpdating(true);

      // Get current product data
      const product = inventoryData.find(p => p._id === selectedProduct._id);
      if (!product) {
        throw new Error('Product not found');
      }

      // Prepare updated sizes array
      let updatedSizes = [...(product.sizes || [])];
      
      if (selectedSizeIndex !== null && updatedSizes[selectedSizeIndex]) {
        // Update specific size
        const currentStock = updatedSizes[selectedSizeIndex].stockQuantity || 0;
        const quantityNum = parseInt(quantity);
        updatedSizes[selectedSizeIndex] = {
          ...updatedSizes[selectedSizeIndex],
          stockQuantity: operation === 'add' ? currentStock + quantityNum : quantityNum,
          inStock: (operation === 'add' ? currentStock + quantityNum : quantityNum) > 0,
        };
      } else {
        // Update all sizes proportionally or set all to same value
        updatedSizes = updatedSizes.map(size => {
          const currentStock = size.stockQuantity || 0;
          const quantityNum = parseInt(quantity);
          return {
            ...size,
            stockQuantity: operation === 'add' ? currentStock + quantityNum : quantityNum,
            inStock: (operation === 'add' ? currentStock + quantityNum : quantityNum) > 0,
          };
        });
      }

      // Update product via API using FormData (required for image handling)
      const formDataToSend = new FormData();
      const productData = {
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        category: product.category,
        gender: product.gender,
        tag: product.tag,
        sizes: updatedSizes,
        active: product.active,
        existingImages: product.images || [],
      };

      formDataToSend.append('productData', JSON.stringify(productData));

      // Use fetch directly since apiRequest doesn't handle FormData well
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ozme.in/api';
      const token = sessionStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE_URL}/admin/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data && data.success) {
        // Refresh products list
        await fetchProducts();
        setIsModalOpen(false);
        setSelectedProduct(null);
        setSelectedSizeIndex(null);
        setQuantity('');
        setReason('');
        setNotes('');
        alert('Stock updated successfully!');
      } else {
        throw new Error(data?.message || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      alert(err.message || 'Failed to update stock');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (alert) => {
    if (alert) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
        In Stock
        </span>
    );
  };

  // Calculate stats from real product data
  const stats = {
    totalProducts: inventoryData.length,
    totalStock: inventoryData.reduce((sum, product) => {
      if (product.sizes && Array.isArray(product.sizes)) {
        return sum + product.sizes.reduce((sizeSum, size) => sizeSum + (size.stockQuantity || 0), 0);
      }
      return sum + (product.stockQuantity || 0);
    }, 0),
    lowStock: inventoryData.filter(product => {
      if (product.sizes && Array.isArray(product.sizes)) {
        return product.sizes.some(size => (size.stockQuantity || 0) <= 10);
      }
      return (product.stockQuantity || 0) <= 10;
    }).length,
    warehouses: 1 // Single warehouse for now
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2 tracking-tight">
            Inventory <span className="font-serif italic text-amber-600">Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">Track and manage your product inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Stock</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Products</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.totalProducts}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Stock</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.totalStock}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500 to-rose-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Low Stock Items</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.lowStock}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg">
              <TrendingDown className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Warehouses</p>
              <h3 className="text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">{stats.warehouses}</h3>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Warehouse className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading inventory...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/20 p-12 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Inventory Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-100/20 dark:border-blue-900/20 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-amber-100/20 dark:border-blue-900/20">
            <h2 className="text-xl font-light text-gray-900 dark:text-white">
              Product <span className="font-serif italic">Inventory</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50/50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Sizes & Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Total Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/20 dark:divide-blue-900/20">
                {inventoryData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No products found
                    </td>
                  </tr>
                ) : (
                  inventoryData.map((product) => {
                    const sizes = product.sizes || [];
                    const totalStock = sizes.reduce((sum, size) => sum + (size.stockQuantity || 0), 0) || (product.stockQuantity || 0);
                    const hasLowStock = sizes.some(size => (size.stockQuantity || 0) <= 10) || (product.stockQuantity || 0) <= 10;
                    
                    return (
                      <tr key={product._id} className="hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {product.category || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {sizes.length > 0 ? (
                              sizes.map((size, index) => {
                                const isLowStock = (size.stockQuantity || 0) <= 10;
                                return (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      isLowStock
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {size.size}: {size.stockQuantity || 0}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-sm text-gray-500">No sizes</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${
                            hasLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {totalStock} units
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(hasLowStock)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenStockModal(product)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!updating) {
            setIsModalOpen(false);
            setSelectedProduct(null);
            setSelectedSizeIndex(null);
          }
        }}
        title={selectedProduct ? `Update Stock - ${selectedProduct.name}` : 'Update Stock'}
      >
        {selectedProduct && (
          <div className="space-y-5">
            {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Size (Optional - leave empty to update all sizes)
                  </label>
                  <select
                    value={selectedSizeIndex !== null ? selectedSizeIndex : ''}
                    onChange={(e) => setSelectedSizeIndex(e.target.value === '' ? null : parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
                  >
                    <option value="">All Sizes</option>
                    {selectedProduct.sizes.map((size, index) => (
                      <option key={index} value={index}>
                        {size.size} - Current: {size.stockQuantity || 0} units
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSizeIndex !== null && selectedProduct.sizes[selectedSizeIndex] && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>Selected:</strong> {selectedProduct.sizes[selectedSizeIndex].size} - 
                      Current Stock: {selectedProduct.sizes[selectedSizeIndex].stockQuantity || 0} units
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Current Stock: {selectedProduct.stockQuantity || 0} units
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Operation
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
              >
                <option value="add">Add to Current Stock</option>
                <option value="set">Set Stock Quantity</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {operation === 'add' ? 'Quantity to Add' : 'New Stock Quantity'}
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={operation === 'add' ? 'Enter quantity to add' : 'Enter new stock quantity'}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
            >
              <option value="">Select reason</option>
              <option>New Purchase</option>
              <option>Return from Customer</option>
              <option>Transfer from Another Warehouse</option>
              <option>Manual Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add any additional notes..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-all resize-none"
            />
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (Optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-all"
              >
                <option value="">Select reason</option>
                <option>New Purchase</option>
                <option>Return from Customer</option>
                <option>Transfer from Another Warehouse</option>
                <option>Manual Adjustment</option>
                <option>Stock Correction</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="Add any additional notes..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  if (!updating) {
                    setIsModalOpen(false);
                    setSelectedProduct(null);
                    setSelectedSizeIndex(null);
                  }
                }}
                disabled={updating}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                disabled={updating || !quantity}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;