#!/usr/bin/env python3
"""
Check what's on the lander page that the auth redirects to
"""

import urllib.request

def check_lander():
    """Check the lander page"""
    print("🛬 Testing Lander Page")
    print("=" * 30)
    
    lander_url = "https://deepify.org/lander"
    try:
        with urllib.request.urlopen(lander_url, timeout=10) as response:
            content = response.read().decode('utf-8')
            print(f"✅ Lander: {response.status} {response.reason}")
            print(f"📄 Full content:\n{content}")
                
    except Exception as e:
        print(f"❌ Lander test failed: {e}")

if __name__ == "__main__":
    check_lander()