import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Cart = () => {
  const { 
    items, 
    total, 
    loading, 
    error, 
    removeFromCart, 
    clearCart, 
    addToCart,
    loadCart 
  } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleIncreaseQuantity = async (productId) => {
    await addToCart(productId, 1);
  };

  const handleDecreaseQuantity = async (item) => {
    if (item.quantity > 1) {
      // For decreasing, we remove the item and add back with reduced quantity
      // This is a workaround since our API doesn't have update quantity endpoint
      await removeFromCart(item.product_id);
      if (item.quantity > 1) {
        await addToCart(item.product_id, item.quantity - 1);
      }
    } else {
      await removeFromCart(item.product_id);
    }
  };

  const handleRemoveItem = async (productId) => {
    await removeFromCart(productId);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading cart..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message="Failed to load cart. Please try again."
          onRetry={loadCart}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200 shadow-lg mb-8 rounded-2xl">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Shopping Cart
            </h1>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        /* Empty Cart */
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-6">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link to="/home" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      ) : (
        /* Cart with Items */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onIncrease={handleIncreaseQuantity}
                  onDecrease={handleDecreaseQuantity}
                  onRemove={handleRemoveItem}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary w-full mb-4 flex items-center justify-center gap-2">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link 
                to="/home" 
                className="btn btn-secondary w-full text-center"
              >
                Continue Shopping
              </Link>

              {/* Additional Info */}
              <div className="mt-6 text-sm text-gray-600">
                <p className="mb-2">✓ Free shipping on all orders</p>
                <p className="mb-2">✓ 30-day return policy</p>
                <p>✓ Secure checkout</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Cart Item Component
const CartItem = ({ item, onIncrease, onDecrease, onRemove, formatPrice }) => {
  const itemTotal = item.price * item.quantity;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        {/* Product Info */}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            Product #{item.product_id}
          </h4>
          <p className="text-gray-600 text-sm mb-2">
            {formatPrice(item.price)} each
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDecrease(item)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <span className="w-12 text-center font-medium">
            {item.quantity}
          </span>
          
          <button
            onClick={() => onIncrease(item.product_id)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Item Total */}
        <div className="w-24 text-right">
          <span className="font-semibold text-gray-900">
            {formatPrice(itemTotal)}
          </span>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.product_id)}
          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Cart;