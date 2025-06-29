#!/usr/bin/env python3
"""
Simple startup script for the unified FastAPI server
All features are now integrated into app.py
"""

import uvicorn
import os
import sys

def main():
    print("🚀 Starting Unified Amazon Clone Backend Server...")
    print("=" * 60)
    print("✅ All features integrated into single FastAPI app")
    print("✅ ML monitoring, product verification, review analysis")
    print("✅ Real-time AI monitoring for product listings")
    print("✅ BERT text analysis + TensorFlow image analysis")
    print("=" * 60)
    
    # Check if app.py exists
    if not os.path.exists("app.py"):
        print("❌ Error: app.py not found!")
        print("   Make sure you're running this from the backend directory")
        sys.exit(1)
    
    # Start the server
    try:
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()