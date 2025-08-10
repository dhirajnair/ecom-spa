import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../contexts/CartContext';

import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, getItemQuantity } = useCart();

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['product', productId],
    () => api.products.getById(productId),
    {
      enabled: !!productId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleAddToCart = async () => {
    await addToCart(productId, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading product details..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message="Failed to load product details. Please try again."
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message="Product not found."
          showRetry={false}
        />
        <div className="text-center mt-4">
          <Link to="/home" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const inCartQuantity = getItemQuantity(productId);
  const maxQuantity = Math.min(product.stock, 10); // Limit max quantity to 10 or stock

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <div className="container mx-auto py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 mb-8 transition-all duration-300 transform hover:scale-105 bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Products</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Image Section */}
          <div className="space-y-6">
            <div className="card-elevated p-6">
              <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-100 relative group">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            
            {/* Product Features */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
                Why Choose This Product
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span>Premium quality materials</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span>Fast and secure shipping</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span>30-day return guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div className="card-elevated p-8">
              {/* Category Badge */}
              <div className="mb-6">
                <span className="text-sm font-semibold text-primary-700 bg-primary-100 px-4 py-2 rounded-full border border-primary-200">
                  {product.category}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-4xl font-bold text-neutral-900 mb-6 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-5 h-5 ${i < 4 ? 'text-warning-500' : 'text-neutral-300'}`}>
                      ⭐
                    </div>
                  ))}
                </div>
                <span className="text-sm text-neutral-600">(4.2) • 47 reviews</span>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold bg-gradient-text-primary">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-lg text-neutral-500 line-through">
                    {formatPrice(product.price * 1.2)}
                  </span>
                  <span className="bg-error-100 text-error-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Save 20%
                  </span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-8">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200">
                  <Package className="w-6 h-6 text-primary-600" />
                  <div>
                    <div className="font-semibold text-neutral-800">Stock Status</div>
                    <div className={`text-sm font-medium ${
                      product.stock > 0 ? 'text-accent-600' : 'text-error-600'
                    }`}>
                      {product.stock > 0 ? `✓ ${product.stock} units available` : '❌ Out of stock'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">
                  Description
                </h3>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  {product.description}
                </p>
              </div>

              {/* Add to Cart Section */}
              <div className="border-t border-neutral-200 pt-8">
                {product.stock > 0 ? (
                  <div className="space-y-6">
                    {/* Quantity Selector */}
                    <div>
                      <label className="block text-lg font-bold text-neutral-800 mb-3">
                        Quantity
                      </label>
                      <select
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="input-large w-32 text-center font-semibold"
                      >
                        {Array.from({ length: maxQuantity }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Current cart status */}
                    {inCartQuantity > 0 && (
                      <div className="p-4 bg-gradient-to-r from-accent-50 to-accent-100 rounded-xl border border-accent-200">
                        <p className="text-accent-800 font-semibold flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          You have {inCartQuantity} of this item in your cart
                        </p>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAddToCart}
                      className="btn btn-primary btn-xl w-full flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
                    >
                      <ShoppingCart className="w-6 h-6" />
                      Add {quantity} to Cart
                    </button>

                    {/* Additional Actions */}
                    <div className="grid grid-cols-2 gap-4">
                      <button className="btn btn-secondary btn-lg flex items-center justify-center gap-2">
                        <div className="w-5 h-5">💝</div>
                        Add to Wishlist
                      </button>
                      {inCartQuantity > 0 && (
                        <Link 
                          to="/cart" 
                          className="btn btn-accent btn-lg flex items-center justify-center gap-2"
                        >
                          View Cart →
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 text-error-500" />
                    </div>
                    <p className="text-error-600 font-bold text-lg mb-4">
                      This product is currently out of stock
                    </p>
                    <button className="btn btn-secondary btn-lg" disabled>
                      Out of Stock
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Product Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <h4 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
              Product Details
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Category:</span>
                <span className="font-semibold text-neutral-800">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Stock:</span>
                <span className="font-semibold text-neutral-800">{product.stock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">SKU:</span>
                <span className="font-semibold text-neutral-800">#{product.id}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-accent rounded-full"></div>
              Shipping Info
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                <span className="text-neutral-600">Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                <span className="text-neutral-600">Express delivery available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                <span className="text-neutral-600">Ships within 24 hours</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-warning-500 to-error-500 rounded-full"></div>
              Guarantee
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                <span className="text-neutral-600">30-day money back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                <span className="text-neutral-600">Secure payment processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                <span className="text-neutral-600">Customer support 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;