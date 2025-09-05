#!/usr/bin/env python3
import requests
import json

BASE_URL = "https://chic-attire-6.preview.emergentagent.com"

def test_simple_api():
    try:
        print("Testing API endpoints...")
        
        # Test products endpoint
        print("1. Testing /api/products")
        response = requests.get(f"{BASE_URL}/api/products", timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
        else:
            print(f"   Error: {response.text[:200]}")
        
        # Test init-data endpoint
        print("\n2. Testing /api/init-data")
        response = requests.post(f"{BASE_URL}/api/init-data", timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"   Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_simple_api()