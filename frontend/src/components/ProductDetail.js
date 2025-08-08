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
          <Link to="/" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const inCartQuantity = getItemQuantity(productId);
  const maxQuantity = Math.min(product.stock, 10); // Limit max quantity to 10 or stock

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
            }}
          />
        </div>

        {/* Product Information */}
        <div className="flex flex-col">
          {/* Category */}
          <div className="mb-4">
            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {product.category}
            </span>
          </div>

          {/* Product Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Stock Status:
              </span>
              <span className={`text-sm font-medium ${
                product.stock > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Add to Cart Section */}
          <div className="border-t pt-6">
            {product.stock > 0 ? (
              <>
                {/* Quantity Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <select
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="input w-24"
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
                  <div className="mb-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <ShoppingCart className="w-4 h-4 inline mr-1" />
                      You have {inCartQuantity} of this item in your cart
                    </p>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add {quantity} to Cart
                </button>

                {/* Cart link */}
                {inCartQuantity > 0 && (
                  <div className="mt-4 text-center">
                    <Link 
                      to="/cart" 
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Cart →
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-600 font-medium mb-4">
                  This product is currently out of stock
                </p>
                <button className="btn btn-secondary" disabled>
                  Out of Stock
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Product Info (if needed) */}
      <div className="mt-12 border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Product Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Category</h4>
            <p className="text-gray-600">{product.category}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Stock</h4>
            <p className="text-gray-600">{product.stock} units available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;