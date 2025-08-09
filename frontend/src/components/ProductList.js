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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="card group hover:shadow-md transition-all duration-200">
                {/* Product Image - Much smaller and compact */}
                <div className="aspect-[3/2] overflow-hidden bg-gray-50">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/180x120?text=No+Image';
                    }}
                  />
                </div>

                {/* Product Info - More compact */}
                <div className="p-3">
                  {/* Category Badge */}
                  <div className="mb-2">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-medium text-gray-900 mb-1 text-sm line-clamp-2 leading-tight">
                    <Link 
                      to={`/products/${product.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {product.name}
                    </Link>
                  </h3>

                  {/* Price and Stock - Simplified */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                    </span>
                  </div>

                  {/* Single Action Button */}
                  <div className="flex justify-center w-full">
                    {isInCart(product.id) ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600 font-medium">
                          In Cart ({getItemQuantity(product.id)})
                        </span>
                        <Link
                          to={`/products/${product.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          View Details
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={product.stock === 0}
                        className={`btn btn-sm ${
                          product.stock === 0 
                            ? 'btn-secondary cursor-not-allowed' 
                            : 'btn-primary'
                        }`}
                        title={
                          product.stock === 0
                            ? 'Out of stock'
                            : 'Add to cart'
                        }
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    )}
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