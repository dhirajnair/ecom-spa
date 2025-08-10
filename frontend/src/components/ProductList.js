import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Filter, Grid3X3, List, Heart, Star, Search, X } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../contexts/CartContext';

import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const ProductList = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list' - default to list for detail view
  const [gridCols, setGridCols] = useState(4); // 2, 3, 4, 5
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState(new Set());
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

  const products = React.useMemo(() => productsData?.products || [], [productsData]);
  const categories = React.useMemo(() => categoriesData?.categories || [], [categoriesData]);

  // Debug categories data
  console.log('🏷️ ProductList: Categories state:', {
    categoriesData,
    categories,
    categoriesLoading,
    categoriesError: categoriesError?.message
  });

  // Enhanced filtering and sorting
  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      
      // Price filter
      const matchesPrice = (!priceRange.min || product.price >= parseFloat(priceRange.min)) &&
                          (!priceRange.max || product.price <= parseFloat(priceRange.max));
      
      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
  };

  const toggleWishlist = (productId) => {
    const newWishlist = new Set(wishlist);
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
    } else {
      newWishlist.add(productId);
    }
    setWishlist(newWishlist);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
  };

  const getGridColsClass = () => {
    switch (gridCols) {
      case 2: return 'lg:grid-cols-2';
      case 3: return 'lg:grid-cols-3';
      case 4: return 'lg:grid-cols-4';
      case 5: return 'lg:grid-cols-5';
      default: return 'lg:grid-cols-4';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (productsLoading || categoriesLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <div className="flex">
        {/* Desktop Sidebar Filters */}
        <div className={`hidden lg:block w-80 bg-gradient-to-b from-white to-primary-50 shadow-2xl border-r border-primary-200 ${showFilters ? 'block' : ''}`}>
          <div className="p-6 bg-white shadow-lg rounded-xl m-4 border border-primary-100 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
              Filters
            </h2>
            
            {/* Search */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-neutral-700 mb-3">Search Products</label>
              <div className="flex items-center gap-3">
                <Search className="text-primary-400 w-5 h-5 flex-shrink-0" />
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-primary-100 rounded-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-neutral-700 mb-3">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-primary-100 rounded-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer"
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-neutral-700 mb-3">Price Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-2">Minimum</label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-primary-100 rounded-lg focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all duration-200 bg-white/80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-2">Maximum</label>
                  <input
                    type="number"
                    placeholder="$999"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-primary-100 rounded-lg focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all duration-200 bg-white/80"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full px-4 py-3 bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-700 font-semibold rounded-xl hover:from-neutral-200 hover:to-neutral-300 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white shadow-2xl">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 shadow-lg">
            <div className="container mx-auto px-6 py-12">
              <div className="text-center">
                <div className="mb-4">
                  <span className="inline-block px-4 py-2 bg-white/20 text-white rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20">
                    Premium Collection
                  </span>
                </div>
                <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                  Our Products
                </h1>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                  Discover our amazing collection of premium products crafted with passion and designed for excellence
                </p>
                <div className="mt-6 flex items-center justify-center gap-8 text-sm text-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span>Premium Quality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span>Fast Shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <span>30-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">

            {/* Mobile Search & Filters */}
            <div className="lg:hidden mb-6">
              <div className="bg-gradient-to-r from-white to-primary-50 p-6 rounded-2xl shadow-xl border border-primary-100">
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 flex items-center gap-3">
                    <Search className="text-primary-400 w-5 h-5 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-primary-100 rounded-xl focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200 bg-white/80"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-3 bg-gradient-primary text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
                
                {showFilters && (
                  <div className="space-y-4 border-t pt-4">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Min</label>
                        <input
                          type="number"
                          placeholder="$0"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Max</label>
                        <input
                          type="number"
                          placeholder="$999"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                          className="input w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Toolbar */}
            <div className="card-elevated p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-6">
                {/* Results count */}
                <div className="bg-primary-100 px-4 py-2 rounded-full border border-primary-200">
                  <p className="text-sm font-semibold text-neutral-700">
                    {filteredAndSortedProducts.length} of {products.length} products
                    {selectedCategory && ` in ${selectedCategory}`}
                    {(searchTerm || priceRange.min || priceRange.max) && ' (filtered)'}
                  </p>
                </div>
                
                {/* Sort */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-neutral-700">Sort:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border-2 border-primary-100 rounded-lg focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all duration-200 bg-white/80 text-sm font-medium"
                  >
                    <option value="name">Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-2">
                {/* Grid Columns */}
                {viewMode === 'grid' && (
                  <div className="flex items-center gap-2 mr-6">
                    <span className="text-sm font-semibold text-gray-700">Columns:</span>
                    <div className="flex gap-1">
                      {[2, 3, 4, 5].map(cols => (
                        <button
                          key={cols}
                          onClick={() => setGridCols(cols)}
                          className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                            gridCols === cols 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {cols}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">View:</span>
                  <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center justify-center p-2 transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center justify-center p-2 transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Display */}
            <div className="container mx-auto px-4 pb-8">
            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory || priceRange.min || priceRange.max
                    ? 'Try adjusting your search or filter criteria'
                    : 'No products available at the moment'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Enhanced Grid View */}
                {viewMode === 'grid' && (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${getGridColsClass()} gap-8`}>
                    {filteredAndSortedProducts.map(product => (
                      <div key={product.id} className="group card-elevated overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fadeIn">
                        {/* Enhanced Product Image */}
                        <div className="relative aspect-square overflow-hidden bg-neutral-100">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                            }}
                          />
                          
                          {/* Enhanced Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Wishlist Button */}
                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className={`absolute top-3 right-3 p-2.5 rounded-xl shadow-lg transition-all duration-300 backdrop-blur-sm z-10 ${
                              wishlist.has(product.id) 
                                ? 'bg-error-500 text-white transform scale-110' 
                                : 'bg-white/90 text-neutral-400 hover:text-error-500 hover:bg-white'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${wishlist.has(product.id) ? 'fill-current' : ''}`} />
                          </button>

                          {/* Stock Badges */}
                          {product.stock <= 5 && product.stock > 0 && (
                            <div className="absolute top-3 left-3 bg-warning-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold z-10 shadow-lg">
                              Only {product.stock} left!
                            </div>
                          )}
                          
                          {product.stock === 0 && (
                            <div className="absolute top-3 left-3 bg-error-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold z-10 shadow-lg">
                              Sold Out
                            </div>
                          )}

                          {/* Quick View Button */}
                          <Link
                            to={`/products/${product.id}`}
                            className="absolute bottom-3 left-3 right-3 btn btn-secondary backdrop-blur-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                          >
                            Quick View
                          </Link>
                        </div>

                        {/* Enhanced Product Info */}
                        <div className="p-6">
                          {/* Category Badge */}
                          <div className="mb-3">
                            <span className="text-xs font-bold text-primary-700 bg-primary-100 px-3 py-1 rounded-full border border-primary-200">
                              {product.category}
                            </span>
                          </div>

                          {/* Product Title */}
                          <h3 className="font-bold text-neutral-900 mb-3 text-lg line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
                            <Link 
                              to={`/products/${product.id}`}
                              className="hover:text-primary-600 transition-colors"
                            >
                              {product.name}
                            </Link>
                          </h3>

                          {/* Rating Stars */}
                          <div className="flex items-center mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < 4 ? 'text-warning-500 fill-current' : 'text-neutral-300'}`} 
                              />
                            ))}
                            <span className="text-sm text-neutral-500 ml-2 font-medium">(4.2) • 47 reviews</span>
                          </div>

                          {/* Price */}
                          <div className="mb-4">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-neutral-900">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-sm text-neutral-500 line-through">
                                {formatPrice(product.price * 1.2)}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 mt-1">
                              {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            {isInCart(product.id) ? (
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2 text-accent-600">
                                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                                  <span className="text-sm font-semibold">
                                    In Cart ({getItemQuantity(product.id)})
                                  </span>
                                </div>
                                <Link
                                  to={`/products/${product.id}`}
                                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                  View Details →
                                </Link>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(product.id)}
                                disabled={product.stock === 0}
                                className={`w-full btn-lg ${
                                  product.stock === 0 
                                    ? 'btn btn-secondary cursor-not-allowed' 
                                    : 'btn btn-primary shadow-lg hover:shadow-xl'
                                } flex items-center justify-center gap-2`}
                              >
                                <ShoppingCart className="w-5 h-5" />
                                {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    {filteredAndSortedProducts.map(product => (
                      <div key={product.id} className="card hover:shadow-lg transition-all duration-200 border border-gray-200">
                        <div className="flex p-4 gap-6 relative">
                          {/* Product Image */}
                          <div className="relative flex-shrink-0 w-40 h-40 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/160x160?text=No+Image';
                              }}
                            />
                          </div>



                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
                                  {product.category}
                                </span>
                                {/* Wishlist Button - Moved here next to category */}
                                <button
                                  onClick={() => toggleWishlist(product.id)}
                                  className={`p-1.5 rounded-full shadow-sm transition-all ${
                                    wishlist.has(product.id) 
                                      ? 'bg-red-500 text-white' 
                                      : 'bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50'
                                  }`}
                                >
                                  <Heart className={`w-3 h-3 ${wishlist.has(product.id) ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-gray-900">
                                  {formatPrice(product.price)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                                </div>
                              </div>
                            </div>
                            
                            <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                              <Link 
                                to={`/products/${product.id}`}
                                className="hover:text-blue-600 transition-colors"
                              >
                                {product.name}
                              </Link>
                            </h3>

                            {/* Rating */}
                            <div className="flex items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="text-sm text-gray-500 ml-2">(4.0) • 24 reviews</span>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {product.description}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-4">
                              {isInCart(product.id) ? (
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-green-600 font-medium">
                                    ✓ In Cart ({getItemQuantity(product.id)})
                                  </span>
                                  <Link
                                    to={`/products/${product.id}`}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                  >
                                    View Details →
                                  </Link>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAddToCart(product.id)}
                                  disabled={product.stock === 0}
                                  className={`btn ${
                                    product.stock === 0 
                                      ? 'btn-secondary cursor-not-allowed' 
                                      : 'btn-primary'
                                  } flex items-center gap-2`}
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                              )}
                              
                              <Link
                                to={`/products/${product.id}`}
                                className="btn btn-secondary"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProductList;