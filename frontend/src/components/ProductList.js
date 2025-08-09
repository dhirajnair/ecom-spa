import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Filter } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../contexts/CartContext';

import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const ProductList = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart, isInCart, getItemQuantity } = useCart();

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery(
    ['products', selectedCategory],
    async () => {
      console.log('🛒 ProductList: Fetching products with category:', selectedCategory);
      console.log('🛒 ProductList: Current location:', window.location.href);
      console.log('🛒 ProductList: Current basename from router might be affecting API calls');
      try {
        const result = await api.products.getAll({ 
          category: selectedCategory || undefined,
          limit: 50 
        });
        console.log('✅ ProductList: Products API response:', result);
        return result;
      } catch (error) {
        console.error('❌ ProductList: Products API error:', error);
        console.error('❌ ProductList: Error details:', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
        throw error;
      }
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery(
    'categories',
    async () => {
      console.log('🏷️ ProductList: Fetching categories...');
      try {
        const result = await api.products.getCategories();
        console.log('✅ ProductList: Categories API response:', result);
        return result;
      } catch (error) {
        console.error('❌ ProductList: Categories API error:', error);
        console.error('❌ ProductList: Categories error details:', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
        throw error;
      }
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];

  // Debug categories data
  console.log('🏷️ ProductList: Categories state:', {
    categoriesData,
    categories,
    categoriesLoading,
    categoriesError: categoriesError?.message
  });

  // Filter products by search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (productsLoading) {
    return <LoadingSpinner text="Loading products..." />;
  }

  if (productsError) {
    return (
      <ErrorMessage
        message="Failed to load products. Please try again."
        onRetry={refetchProducts}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Our Products
        </h1>
        <p className="text-gray-600">
          Discover our amazing collection of products
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          {/* Category Filter */}
          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading 
                  ? 'Loading categories...' 
                  : categoriesError 
                  ? 'Failed to load categories' 
                  : 'All Categories'
                }
              </option>
              {!categoriesLoading && !categoriesError && categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {categoriesError && (
              <p className="text-xs text-red-500 mt-1">
                Error loading categories: {categoriesError.message}
              </p>
            )}
          </div>

          {/* Filter Icon */}
          <div className="flex items-center text-gray-400">
            <Filter className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No products found
          </h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'No products available at the moment'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="card group hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    <Link 
                      to={`/products/${product.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {product.name}
                    </Link>
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Link
                      to={`/products/${product.id}`}
                      className="btn btn-secondary flex-1 text-center"
                    >
                      View Details
                    </Link>

                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0 || isInCart(product.id)}
                      className={`btn flex items-center gap-1 ${
                        isInCart(product.id)
                          ? 'btn-secondary cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                      title={
                        product.stock === 0
                          ? 'Out of stock'
                          : isInCart(product.id)
                          ? `In cart (${getItemQuantity(product.id)})`
                          : 'Add to cart'
                      }
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isInCart(product.id) 
                        ? `${getItemQuantity(product.id)}` 
                        : product.stock === 0 
                        ? 'Out of Stock'
                        : 'Add'
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductList;