#!/usr/bin/env python3
"""
Test the OAuth flow to see if we can authenticate and then access MCP
"""

import urllib.request
import urllib.error
import urllib.parse
import json

def test_oauth_flow():
    """Test the basic OAuth flow"""
    print("🔐 Testing OAuth Flow")
    print("=" * 40)
    
    # Step 1: Test authorization endpoint
    auth_url = "https://deepify.org/authorize"
    try:
        with urllib.request.urlopen(auth_url, timeout=10) as response:
            content = response.read().decode('utf-8')
            print(f"✅ Authorization endpoint: {response.status} {response.reason}")
            print(f"📄 Content preview: {content[:200]}...")
            
            # Look for OAuth parameters in the response
            if "client_id" in content or "redirect_uri" in content or "github" in content.lower():
                print("🔍 OAuth flow detected - requires GitHub authentication")
            else:
                print("❓ Response doesn't look like OAuth flow")
                
    except Exception as e:
        print(f"❌ Authorization test failed: {e}")
    
    print("\n" + "=" * 40)
    print("🎯 **Next Steps:**")
    print("1. The MCP server requires GitHub OAuth authentication")
    print("2. Need to set up proper OAuth client credentials") 
    print("3. Or check if there's a direct API endpoint for testing")
    print("4. Check GitHub Actions deployment logs for any errors")

if __name__ == "__main__":
    test_oauth_flow()