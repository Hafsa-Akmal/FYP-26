'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, User, Menu, X, Filter } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filter states
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Fetch user data
  useEffect(() => {
    checkAuth();
    fetchProducts();
    fetchCart();
    initializeData();
  }, []);

  // Filter products based on selected filters
  useEffect(() => {
    let filtered = products;

    if (selectedGender) {
      filtered = filtered.filter(product => product.gender === selectedGender);
    }
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    if (selectedColor) {
      filtered = filtered.filter(product => product.colors.includes(selectedColor));
    }
    if (selectedSize) {
      filtered = filtered.filter(product => product.sizes.includes(selectedSize));
    }
    if (priceRange.min) {
      filtered = filtered.filter(product => product.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => product.price <= parseFloat(priceRange.max));
    }

    setFilteredProducts(filtered);
  }, [products, selectedGender, selectedCategory, selectedColor, selectedSize, priceRange]);

  const initializeData = async () => {
    try {
      await fetch('/api/init-data', { method: 'POST' });
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        setFilteredProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      if (data.success) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (product, size = 'M', color = product.colors[0]) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          size,
          color
        })
      });

      const data = await response.json();
      if (data.success) {
        setCart(data.cart);
        alert('Item added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setCart([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearFilters = () => {
    setSelectedGender('');
    setSelectedCategory('');
    setSelectedColor('');
    setSelectedSize('');
    setPriceRange({ min: '', max: '' });
  };

  const newArrivals = filteredProducts.slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FASHION</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setSelectedGender('men')}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Men
              </button>
              <button
                onClick={() => setSelectedGender('women')}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Women
              </button>
              <button
                onClick={() => setSelectedGender('kids')}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Kids
              </button>
              <button
                onClick={() => setSelectedCategory('accessories')}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Accessories
              </button>
            </nav>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-700 hover:text-gray-900 md:hidden"
              >
                <Filter className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>

              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Hi, {user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login" className="text-sm text-gray-700 hover:text-gray-900">
                    Login
                  </Link>
                  <Link href="/register" className="text-sm bg-black text-white px-3 py-1 rounded">
                    Sign Up
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-2">
              <button
                onClick={() => { setSelectedGender('men'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-gray-700"
              >
                Men
              </button>
              <button
                onClick={() => { setSelectedGender('women'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-gray-700"
              >
                Women
              </button>
              <button
                onClick={() => { setSelectedGender('kids'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-gray-700"
              >
                Kids
              </button>
              <button
                onClick={() => { setSelectedCategory('accessories'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-gray-700"
              >
                Accessories
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-96 md:h-[500px] bg-gray-100">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1649624963958-554d32e28c55"
            alt="Fashion Hero"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white">
          <div className="max-w-2xl px-4">
            <h2 className="text-4xl md:text-6xl font-light mb-4">
              New Collection
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Discover the latest trends in fashion
            </p>
            <button
              onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-black px-8 py-3 text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>

              {/* Gender Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Gender</h4>
                <div className="space-y-2">
                  {['men', 'women', 'kids'].map(gender => (
                    <label key={gender} className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={selectedGender === gender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className="mr-2"
                      />
                      <span className="capitalize">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Category</h4>
                <div className="space-y-2">
                  {['shirts', 'jeans', 'accessories', 'sets'].map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={selectedCategory === category}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2"
                      />
                      <span className="capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Color</h4>
                <div className="space-y-2">
                  {['white', 'black', 'blue', 'navy', 'gray', 'beige', 'brown', 'gold', 'silver'].map(color => (
                    <label key={color} className="flex items-center">
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        checked={selectedColor === color}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="mr-2"
                      />
                      <span className="capitalize">{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Size</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                      className={`py-1 px-2 text-sm border rounded ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Price Range</h4>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* New Arrivals Section */}
            {!selectedGender && !selectedCategory && !selectedColor && !selectedSize && !priceRange.min && !priceRange.max && (
              <section className="mb-12">
                <h2 className="text-2xl font-light mb-6 text-center">New Arrivals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {newArrivals.map(product => (
                    <div key={product.id} className="group">
                      <div className="relative overflow-hidden bg-gray-100 rounded-lg">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={300}
                          height={400}
                          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => addToCart(product)}
                          className="absolute bottom-4 left-4 right-4 bg-black text-white py-2 px-4 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          Add to Cart
                        </button>
                      </div>
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-gray-600">${product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Products Grid */}
            <section id="products">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light">
                  Products ({filteredProducts.length})
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No products found matching your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="group">
                      <div className="relative overflow-hidden bg-gray-100 rounded-lg">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={300}
                          height={400}
                          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => addToCart(product)}
                          className="absolute bottom-4 left-4 right-4 bg-black text-white py-2 px-4 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          Add to Cart
                        </button>
                      </div>
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-gray-600">${product.price}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-500">Colors:</span>
                          <div className="flex space-x-1">
                            {product.colors.slice(0, 3).map(color => (
                              <div
                                key={color}
                                className={`w-4 h-4 rounded-full border ${
                                  color === 'white' ? 'bg-white border-gray-300' :
                                  color === 'black' ? 'bg-black' :
                                  color === 'blue' ? 'bg-blue-500' :
                                  color === 'navy' ? 'bg-blue-900' :
                                  color === 'gray' ? 'bg-gray-500' :
                                  color === 'beige' ? 'bg-yellow-200' :
                                  color === 'brown' ? 'bg-yellow-800' :
                                  color === 'gold' ? 'bg-yellow-400' :
                                  'bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FASHION</h3>
              <p className="text-gray-400">
                Your destination for the latest trends in fashion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Men</a></li>
                <li><a href="#" className="hover:text-white">Women</a></li>
                <li><a href="#" className="hover:text-white">Kids</a></li>
                <li><a href="#" className="hover:text-white">Accessories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Size Guide</a></li>
                <li><a href="#" className="hover:text-white">Returns</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Instagram</a></li>
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Pinterest</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FASHION. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}