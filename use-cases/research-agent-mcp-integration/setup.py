#!/usr/bin/env python3
"""
Setup script for Research Agent MCP Integration

This script helps set up the complete research-to-project workflow.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path


def run_command(command, cwd=None):
    """Run a shell command and return success status"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            capture_output=True, 
            text=True
        )
        if result.returncode != 0:
            print(f"❌ Command failed: {command}")
            print(f"Error: {result.stderr}")
            return False
        return True
    except Exception as e:
        print(f"❌ Exception running command: {e}")
        return False


def check_python_version():
    """Check Python version compatibility"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True


def check_mcp_server():
    """Check if MCP server directory exists"""
    mcp_server_path = Path("../mcp-server/deepify-mcp-server")
    if not mcp_server_path.exists():
        print(f"❌ MCP server not found at {mcp_server_path}")
        print("Please ensure you're running this from the correct directory")
        return False
    print(f"✅ MCP server found at {mcp_server_path}")
    return True


def setup_environment():
    """Set up Python environment and dependencies"""
    print("\n📦 Setting up Python environment...")
    
    # Check if virtual environment exists
    venv_path = Path("venv")
    if not venv_path.exists():
        print("Creating virtual environment...")
        if not run_command("python -m venv venv"):
            return False
    
    # Determine pip command based on OS
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip"
        python_cmd = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        pip_cmd = "venv/bin/pip"
        python_cmd = "venv/bin/python"
    
    # Upgrade pip
    print("Upgrading pip...")
    if not run_command(f"{pip_cmd} install --upgrade pip"):
        return False
    
    # Install requirements
    print("Installing requirements...")
    if not run_command(f"{pip_cmd} install -r requirements.txt"):
        return False
    
    print("✅ Python environment set up successfully")
    return True


def setup_env_file():
    """Set up environment file"""
    print("\n⚙️ Setting up environment configuration...")
    
    env_example = Path("env.example")
    env_file = Path(".env")
    
    if not env_file.exists():
        if env_example.exists():
            shutil.copy(env_example, env_file)
            print(f"✅ Created .env file from {env_example}")
            print("📝 Please edit .env file with your API keys and settings")
        else:
            print("❌ env.example file not found")
            return False
    else:
        print("✅ .env file already exists")
    
    return True


def check_api_keys():
    """Check if required API keys are configured"""
    print("\n🔑 Checking API key configuration...")
    
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found")
        return False
    
    required_keys = ["BRAVE_API_KEY", "ANTHROPIC_API_KEY", "MCP_SERVER_URL"]
    missing_keys = []
    
    try:
        with open(env_file, 'r') as f:
            env_content = f.read()
        
        for key in required_keys:
            if f"{key}=" not in env_content or f"{key}=your_" in env_content:
                missing_keys.append(key)
        
        if missing_keys:
            print(f"⚠️ Missing or incomplete configuration for: {', '.join(missing_keys)}")
            print("Please edit your .env file with the correct values")
            return False
        
        print("✅ API keys configuration looks good")
        return True
        
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")
        return False


def test_installation():
    """Test the installation by importing key modules"""
    print("\n🧪 Testing installation...")
    
    try:
        # Test imports
        sys.path.append("src")
        
        from config.settings import settings
        from tools.mcp_client import MCPClient
        from agents.research_agent import research_agent
        
        print("✅ All modules imported successfully")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def print_next_steps():
    """Print next steps for the user"""
    print("\n🎉 Setup Complete!")
    print("=" * 50)
    print("\n📋 Next Steps:")
    print("\n1. **Start your MCP server:**")
    print("   cd ../mcp-server/deepify-mcp-server")
    print("   wrangler dev")
    print("\n2. **Test the MCP client:**")
    print("   python examples/direct_mcp_client.py")
    print("\n3. **Run the research workflow:**")
    print("   python examples/research_workflow.py \"Research Next.js 15 features\"")
    print("\n4. **Configure your API keys in .env file:**")
    print("   - BRAVE_API_KEY: Get from https://brave.com/search/api/")
    print("   - ANTHROPIC_API_KEY: Get from https://console.anthropic.com/")
    print("   - GITHUB_TOKEN: Personal access token for MCP authentication")
    print("\n5. **Activate virtual environment:**")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    
    print("\n🔗 **Integration Architecture:**")
    print("   Research Agent → Web Search → PRP Generation → MCP Server → PostgreSQL")
    print("\n📚 **Example Commands:**")
    print("   python examples/research_workflow.py \"Research FastAPI microservices\"")
    print("   python examples/research_workflow.py \"Research React Server Components\"")
    print("   python examples/direct_mcp_client.py  # Test MCP connection")


def main():
    """Main setup function"""
    print("🚀 Research Agent MCP Integration Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        return 1
    
    if not check_mcp_server():
        return 1
    
    # Setup steps
    steps = [
        setup_environment,
        setup_env_file,
        check_api_keys,
        test_installation
    ]
    
    for step in steps:
        if not step():
            print(f"\n❌ Setup failed at step: {step.__name__}")
            return 1
    
    print_next_steps()
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)