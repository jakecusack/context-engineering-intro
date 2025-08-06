#!/usr/bin/env python3
"""
Quick test to check what endpoints are available on deepify.org
"""

import urllib.request
import urllib.error
import json

def test_endpoint(url, method='GET'):
    """Test an endpoint and return status"""
    try:
        if method == 'POST':
            # For MCP, we need to send a JSON request
            data = json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {
                        "name": "test-client",
                        "version": "1.0.0"
                    }
                }
            }).encode('utf-8')
            
            req = urllib.request.Request(
                url, 
                data=data,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                method=method
            )
        else:
            req = urllib.request.Request(url, method=method)
            
        with urllib.request.urlopen(req, timeout=10) as response:
            return f"✅ {response.status} {response.reason}"
            
    except urllib.error.HTTPError as e:
        return f"❌ HTTP {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return f"❌ URL Error: {e.reason}"
    except Exception as e:
        return f"❌ Error: {str(e)}"

def main():
    print("🧪 Testing deepify.org endpoints")
    print("=" * 50)
    
    base_url = "https://deepify.org"
    endpoints = [
        ("Root", "/", "GET"),
        ("MCP (GET)", "/mcp", "GET"), 
        ("MCP (POST)", "/mcp", "POST"),
        ("SSE", "/sse", "GET"),
        ("OAuth Authorize", "/authorize", "GET"),
        ("OAuth Token", "/token", "GET"),
        ("Register", "/register", "GET"),
    ]
    
    for name, path, method in endpoints:
        url = f"{base_url}{path}"
        print(f"{name:15} {method:4} {url:30} → {test_endpoint(url, method)}")

if __name__ == "__main__":
    main()