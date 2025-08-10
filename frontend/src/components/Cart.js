import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 shadow-lg mb-8">
          <div className="container mx-auto px-6 py-12">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                  Shopping Cart
                </h1>
                <p className="text-xl text-blue-100">
                  {items.length > 0 ? `${items.reduce((sum, item) => sum + item.quantity, 0)} items in your cart` : 'Your shopping destination'}
                </p>
              </div>
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16">
            <div className="card-elevated p-12 max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-neutral-100 to-primary-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <ShoppingCart className="w-16 h-16 text-neutral-400" />
              </div>
              <h3 className="text-3xl font-bold text-neutral-900 mb-4">
                Your cart is empty
              </h3>
              <p className="text-neutral-600 mb-8 text-lg leading-relaxed">
                Discover amazing products and start building your perfect order
              </p>
              <Link to="/home" className="btn btn-primary btn-xl shadow-xl">
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Cart Items</h2>
                <span className="text-neutral-600 bg-neutral-100 px-4 py-2 rounded-full font-semibold">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
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
              <div className="card-elevated p-8 sticky top-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
                  <div className="w-3 h-8 bg-gradient-primary rounded-full"></div>
                  Order Summary
                </h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-neutral-600 text-lg">
                    <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 text-lg">
                    <span>Shipping</span>
                    <span className="font-semibold text-accent-600">Free</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 text-lg">
                    <span>Tax</span>
                    <span className="font-semibold">{formatPrice(total * 0.08)}</span>
                  </div>
                  <div className="border-t-2 border-neutral-200 pt-4">
                    <div className="flex justify-between text-2xl font-bold text-neutral-900">
                      <span>Total</span>
                      <span className="text-primary-600">{formatPrice(total * 1.08)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button className="btn btn-primary btn-xl w-full flex items-center justify-center gap-3 shadow-xl">
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <Link 
                    to="/home" 
                    className="btn btn-secondary btn-lg w-full text-center"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 pt-6 border-t border-neutral-200">
                  <h4 className="font-bold text-neutral-900 mb-4">Why shop with us?</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-accent-600 rounded-full"></div>
                      </div>
                      <span className="text-neutral-600">Free shipping on all orders</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-accent-600 rounded-full"></div>
                      </div>
                      <span className="text-neutral-600">30-day money back guarantee</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-accent-600 rounded-full"></div>
                      </div>
                      <span className="text-neutral-600">Secure SSL checkout</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-accent-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-accent-600 rounded-full"></div>
                      </div>
                      <span className="text-neutral-600">24/7 customer support</span>
                    </div>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="flex items-center justify-center gap-4 opacity-60">
                    <div className="text-xs text-neutral-500 font-semibold">🔒 SSL SECURE</div>
                    <div className="text-xs text-neutral-500 font-semibold">💳 PAYMENTS</div>
                    <div className="text-xs text-neutral-500 font-semibold">✅ VERIFIED</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Cart Item Component
const CartItem = ({ item, onIncrease, onDecrease, onRemove, formatPrice }) => {
  const itemTotal = item.price * item.quantity;

  return (
    <div className="card-elevated p-6 group hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-6">
        {/* Product Image */}
        <div className="w-24 h-24 bg-gradient-to-br from-neutral-100 to-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name || `Product ${item.product_id}`}
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="w-full h-full flex items-center justify-center" style={{ display: item.image_url ? 'none' : 'flex' }}>
            <Package className="w-12 h-12 text-neutral-400" />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-neutral-900 mb-1 text-lg group-hover:text-primary-600 transition-colors">
            {item.name || `Product ${item.product_id}`}
          </h4>
          <p className="text-neutral-600 mb-2">
            <span className="font-semibold">{formatPrice(item.price)}</span> each
          </p>
          {item.category && (
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
              <span>{item.category}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>In Stock • Fast Shipping</span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDecrease(item)}
            className="w-10 h-10 rounded-xl border-2 border-neutral-200 flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 transform hover:scale-105"
          >
            <Minus className="w-4 h-4 text-neutral-600" />
          </button>
          
          <div className="w-16 h-10 bg-neutral-50 border-2 border-neutral-200 rounded-xl flex items-center justify-center mx-1">
            <span className="font-bold text-neutral-900">
              {item.quantity}
            </span>
          </div>
          
          <button
            onClick={() => onIncrease(item.product_id)}
            className="w-10 h-10 rounded-xl border-2 border-neutral-200 flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* Item Total */}
        <div className="text-right min-w-0">
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {formatPrice(itemTotal)}
          </div>
          <div className="text-sm text-neutral-500">
            Total
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.product_id)}
          className="w-10 h-10 text-error-500 hover:bg-error-50 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center border-2 border-transparent hover:border-error-200"
          title="Remove item"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Cart;