#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for eCommerce Clothing Website
Tests all authentication, product, and cart functionality
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Configuration
BASE_URL = "https://chic-attire-6.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class ECommerceAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_data = {
            "name": "Emma Johnson",
            "email": f"emma.johnson.{uuid.uuid4().hex[:8]}@example.com",
            "password": "SecurePass123!"
        }
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_data_initialization(self):
        """Test POST /api/init-data - Initialize sample products"""
        print("\n=== Testing Data Initialization ===")
        try:
            response = self.session.post(f"{API_BASE}/init-data")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("Data Initialization", True, 
                                "Sample data initialized successfully", 
                                f"Response: {data.get('message')}")
                else:
                    self.log_test("Data Initialization", False, 
                                "API returned success=false", 
                                f"Response: {data}")
            else:
                self.log_test("Data Initialization", False, 
                            f"HTTP {response.status_code}", 
                            f"Response: {response.text}")
                
        except Exception as e:
            self.log_test("Data Initialization", False, 
                        f"Request failed: {str(e)}")
    
    def test_user_registration(self):
        """Test POST /api/auth/register - Create new user"""
        print("\n=== Testing User Registration ===")
        try:
            response = self.session.post(
                f"{API_BASE}/auth/register",
                json=self.test_user_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user'):
                    user = data['user']
                    self.log_test("User Registration", True, 
                                "User registered successfully", 
                                f"User ID: {user.get('id')}, Name: {user.get('name')}")
                    return True
                else:
                    self.log_test("User Registration", False, 
                                "Registration failed - no user data", 
                                f"Response: {data}")
            else:
                self.log_test("User Registration", False, 
                            f"HTTP {response.status_code}", 
                            f"Response: {response.text}")
                
        except Exception as e:
            self.log_test("User Registration", False, 
                        f"Request failed: {str(e)}")
        return False
    
    def test_user_login(self):
        """Test POST /api/auth/login - Login user"""
        print("\n=== Testing User Login ===")
        try:
            login_data = {
                "email": self.test_user_data["email"],
                "password": self.test_user_data["password"]
            }
            
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user'):
                    user = data['user']
                    # Check if cookie was set
                    cookies = response.cookies
                    has_token = 'token' in cookies
                    
                    self.log_test("User Login", True, 
                                "User logged in successfully", 
                                f"User: {user.get('name')}, Token Cookie: {has_token}")
                    return True
                else:
                    self.log_test("User Login", False, 
                                "Login failed - invalid response", 
                                f"Response: {data}")
            else:
                self.log_test("User Login", False, 
                            f"HTTP {response.status_code}", 
                            f"Response: {response.text}")
                
        except Exception as e:
            self.log_test("User Login", False, 
                        f"Request failed: {str(e)}")
        return False
    
    def test_get_user_profile(self):
        """Test GET /api/auth/me - Get current user profile"""
        print("\n=== Testing User Profile ===")
        try:
            response = self.session.get(f"{API_BASE}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user'):
                    user = data['user']
                    expected_email = self.test_user_data["email"]
                    if user.get('email') == expected_email:
                        self.log_test("Get User Profile", True, 
                                    "Profile retrieved successfully", 
                                    f"User: {user.get('name')} ({user.get('email')})")
                        return True
                    else:
                        self.log_test("Get User Profile", False, 
                                    "Profile mismatch", 
                                    f"Expected: {expected_email}, Got: {user.get('email')}")
                else:
                    self.log_test("Get User Profile", False, 
                                "Profile retrieval failed", 
                                f"Response: {data}")
            elif response.status_code == 401:
                self.log_test("Get User Profile", False, 
                            "Authentication required", 
                            "User not authenticated")
            else:
                self.log_test("Get User Profile", False, 
                            f"HTTP {response.status_code}", 
                            f"Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get User Profile", False, 
                        f"Request failed: {str(e)}")
        return False
    
    def test_get_products(self):
        """Test GET /api/products - Get all products"""
        print("\n=== Testing Get All Products ===")
        try:
            response = self.session.get(f"{API_BASE}/products")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'products' in data:
                    products = data['products']
                    if len(products) > 0:
                        self.log_test("Get All Products", True, 
                                    f"Retrieved {len(products)} products", 
                                    f"First product: {products[0].get('name')}")
                        return products
                    else:
                        self.log_test("Get All Products", False, 
                                    "No products found", 
                                    "Products array is empty")
                else:
                    self.log_test("Get All Products", False, 
                                "Invalid response format", 
                                f"Response: {data}")
            else:
                self.log_test("Get All Products", False, 
                            f"HTTP {response.status_code}", 
                            f"Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get All Products", False, 
                        f"Request failed: {str(e)}")
        return []
    
    def test_product_filtering(self):
        """Test product filtering with various parameters"""
        print("\n=== Testing Product Filtering ===")
        
        # Test gender filter
        try:
            response = self.session.get(f"{API_BASE}/products?gender=men")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    products = data.get('products', [])
                    men_products = [p for p in products if p.get('gender') == 'men']
                    if len(men_products) == len(products):
                        self.log_test("Filter by Gender (men)", True, 
                                    f"Found {len(products)} men's products")
                    else:
                        self.log_test("Filter by Gender (men)", False, 
                                    "Filter not working correctly", 
                                    f"Expected all men's products, got mixed results")
                else:
                    self.log_test("Filter by Gender (men)", False, 
                                "API returned success=false")
            else:
                self.log_test("Filter by Gender (men)", False, 
                            f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Filter by Gender (men)", False, f"Request failed: {str(e)}")
        
        # Test category filter
        try:
            response = self.session.get(f"{API_BASE}/products?category=shirts")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    products = data.get('products', [])
                    shirt_products = [p for p in products if p.get('category') == 'shirts']
                    if len(shirt_products) == len(products):
                        self.log_test("Filter by Category (shirts)", True, 
                                    f"Found {len(products)} shirt products")
                    else:
                        self.log_test("Filter by Category (shirts)", False, 
                                    "Category filter not working correctly")
                else:
                    self.log_test("Filter by Category (shirts)", False, 
                                "API returned success=false")
            else:
                self.log_test("Filter by Category (shirts)", False, 
                            f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Filter by Category (shirts)", False, f"Request failed: {str(e)}")
        
        # Test color and size filter
        try:
            response = self.session.get(f"{API_BASE}/products?color=blue&size=M")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    products = data.get('products', [])
                    valid_products = [p for p in products 
                                    if 'blue' in p.get('colors', []) and 'M' in p.get('sizes', [])]
                    if len(valid_products) == len(products):
                        self.log_test("Filter by Color & Size", True, 
                                    f"Found {len(products)} blue M-sized products")
                    else:
                        self.log_test("Filter by Color & Size", False, 
                                    "Color/Size filter not working correctly")
                else:
                    self.log_test("Filter by Color & Size", False, 
                                "API returned success=false")
            else:
                self.log_test("Filter by Color & Size", False, 
                            f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Filter by Color & Size", False, f"Request failed: {str(e)}")
        
        # Test price range filter
        try:
            response = self.session.get(f"{API_BASE}/products?minPrice=20&maxPrice=100")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    products = data.get('products', [])
                    valid_products = [p for p in products 
                                    if 20 <= p.get('price', 0) <= 100]
                    if len(valid_products) == len(products):
                        self.log_test("Filter by Price Range", True, 
                                    f"Found {len(products)} products in $20-$100 range")
                    else:
                        self.log_test("Filter by Price Range", False, 
                                    "Price filter not working correctly")
                else:
                    self.log_test("Filter by Price Range", False, 
                                "API returned success=false")
            else:
                self.log_test("Filter by Price Range", False, 
                            f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Filter by Price Range", False, f"Request failed: {str(e)}")
    
    def test_cart_operations(self, products):
        """Test cart functionality"""
        print("\n=== Testing Cart Operations ===")
        
        if not products:
            self.log_test("Cart Operations", False, "No products available for cart testing")
            return
        
        # Test get empty cart
        try:
            response = self.session.get(f"{API_BASE}/cart")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    cart = data.get('cart', [])
                    self.log_test("Get Empty Cart", True, 
                                f"Cart retrieved successfully with {len(cart)} items")
                else:
                    self.log_test("Get Empty Cart", False, "API returned success=false")
            elif response.status_code == 401:
                self.log_test("Get Empty Cart", False, "Authentication required")
                return
            else:
                self.log_test("Get Empty Cart", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Get Empty Cart", False, f"Request failed: {str(e)}")
        
        # Test add item to cart
        test_product = products[0]
        try:
            cart_item = {
                "productId": test_product.get('id'),
                "quantity": 2,
                "size": "M",
                "color": test_product.get('colors', ['blue'])[0]
            }
            
            response = self.session.post(
                f"{API_BASE}/cart/add",
                json=cart_item,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    cart = data.get('cart', [])
                    added_item = next((item for item in cart 
                                     if item.get('productId') == test_product.get('id')), None)
                    if added_item:
                        self.log_test("Add Item to Cart", True, 
                                    f"Added {test_product.get('name')} to cart", 
                                    f"Quantity: {added_item.get('quantity')}")
                    else:
                        self.log_test("Add Item to Cart", False, 
                                    "Item not found in cart after adding")
                else:
                    self.log_test("Add Item to Cart", False, 
                                "API returned success=false", 
                                f"Response: {data}")
            elif response.status_code == 401:
                self.log_test("Add Item to Cart", False, "Authentication required")
            else:
                self.log_test("Add Item to Cart", False, 
                            f"HTTP {response.status_code}", 
                            f"Response: {response.text}")
        except Exception as e:
            self.log_test("Add Item to Cart", False, f"Request failed: {str(e)}")
        
        # Test get cart with items
        try:
            response = self.session.get(f"{API_BASE}/cart")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    cart = data.get('cart', [])
                    if len(cart) > 0:
                        self.log_test("Get Cart with Items", True, 
                                    f"Cart contains {len(cart)} items")
                    else:
                        self.log_test("Get Cart with Items", False, 
                                    "Cart is empty after adding items")
                else:
                    self.log_test("Get Cart with Items", False, "API returned success=false")
            else:
                self.log_test("Get Cart with Items", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Get Cart with Items", False, f"Request failed: {str(e)}")
        
        # Test remove item from cart
        try:
            remove_item = {
                "productId": test_product.get('id'),
                "size": "M",
                "color": test_product.get('colors', ['blue'])[0]
            }
            
            response = self.session.post(
                f"{API_BASE}/cart/remove",
                json=remove_item,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    cart = data.get('cart', [])
                    removed_item = next((item for item in cart 
                                       if item.get('productId') == test_product.get('id')), None)
                    if not removed_item:
                        self.log_test("Remove Item from Cart", True, 
                                    f"Removed {test_product.get('name')} from cart")
                    else:
                        self.log_test("Remove Item from Cart", False, 
                                    "Item still in cart after removal")
                else:
                    self.log_test("Remove Item from Cart", False, 
                                "API returned success=false")
            else:
                self.log_test("Remove Item from Cart", False, 
                            f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Remove Item from Cart", False, f"Request failed: {str(e)}")
    
    def test_unauthenticated_requests(self):
        """Test error handling for unauthenticated requests"""
        print("\n=== Testing Unauthenticated Requests ===")
        
        # Create a new session without authentication
        unauth_session = requests.Session()
        
        # Test accessing user profile without auth
        try:
            response = unauth_session.get(f"{API_BASE}/auth/me")
            if response.status_code == 401:
                data = response.json()
                if not data.get('success'):
                    self.log_test("Unauthenticated Profile Access", True, 
                                "Correctly rejected unauthenticated request")
                else:
                    self.log_test("Unauthenticated Profile Access", False, 
                                "Should have rejected unauthenticated request")
            else:
                self.log_test("Unauthenticated Profile Access", False, 
                            f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_test("Unauthenticated Profile Access", False, f"Request failed: {str(e)}")
        
        # Test accessing cart without auth
        try:
            response = unauth_session.get(f"{API_BASE}/cart")
            if response.status_code == 401:
                data = response.json()
                if not data.get('success'):
                    self.log_test("Unauthenticated Cart Access", True, 
                                "Correctly rejected unauthenticated cart access")
                else:
                    self.log_test("Unauthenticated Cart Access", False, 
                                "Should have rejected unauthenticated request")
            else:
                self.log_test("Unauthenticated Cart Access", False, 
                            f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_test("Unauthenticated Cart Access", False, f"Request failed: {str(e)}")
    
    def test_user_logout(self):
        """Test POST /api/auth/logout - Logout user"""
        print("\n=== Testing User Logout ===")
        try:
            response = self.session.post(f"{API_BASE}/auth/logout")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("User Logout", True, "User logged out successfully")
                    
                    # Verify logout by trying to access profile
                    profile_response = self.session.get(f"{API_BASE}/auth/me")
                    if profile_response.status_code == 401:
                        self.log_test("Logout Verification", True, 
                                    "Session properly cleared after logout")
                    else:
                        self.log_test("Logout Verification", False, 
                                    "Session not properly cleared after logout")
                else:
                    self.log_test("User Logout", False, 
                                "Logout failed - API returned success=false")
            else:
                self.log_test("User Logout", False, 
                            f"HTTP {response.status_code}", 
                            f"Response: {response.text}")
                
        except Exception as e:
            self.log_test("User Logout", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Comprehensive eCommerce API Testing")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"📧 Test User: {self.test_user_data['email']}")
        print("=" * 60)
        
        # Initialize sample data first
        self.test_data_initialization()
        
        # Test authentication flow
        if self.test_user_registration():
            if self.test_user_login():
                self.test_get_user_profile()
                
                # Test product operations
                products = self.test_get_products()
                self.test_product_filtering()
                
                # Test cart operations (requires authentication)
                self.test_cart_operations(products)
                
                # Test logout
                self.test_user_logout()
        
        # Test unauthenticated requests
        self.test_unauthenticated_requests()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        failed = len(self.test_results) - passed
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        print("\n🎯 CRITICAL FUNCTIONALITY STATUS:")
        auth_tests = [r for r in self.test_results if 'auth' in r['test'].lower() or 'login' in r['test'].lower() or 'registration' in r['test'].lower()]
        product_tests = [r for r in self.test_results if 'product' in r['test'].lower()]
        cart_tests = [r for r in self.test_results if 'cart' in r['test'].lower()]
        
        auth_success = all(r['success'] for r in auth_tests if 'unauthenticated' not in r['test'].lower())
        product_success = all(r['success'] for r in product_tests)
        cart_success = all(r['success'] for r in cart_tests if 'unauthenticated' not in r['test'].lower())
        
        print(f"   🔐 Authentication: {'✅ Working' if auth_success else '❌ Issues Found'}")
        print(f"   🛍️  Product System: {'✅ Working' if product_success else '❌ Issues Found'}")
        print(f"   🛒 Cart System: {'✅ Working' if cart_success else '❌ Issues Found'}")

if __name__ == "__main__":
    tester = ECommerceAPITester()
    tester.run_all_tests()