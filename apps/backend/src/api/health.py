"""
Health check endpoint for uptime monitoring.

Provides system status, version information, and current timestamp.
"""

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any


def get_version() -> str:
    """
    Get version from multiple sources with fallback priority:
    1. Environment variable VERSION
    2. Git SHA (short)
    3. package.json version
    4. Fallback to "dev"
    """
    # Try environment variable first
    version = os.getenv('VERSION')
    if version:
        return version
    
    # Try to get git SHA
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent.parent.parent,  # Navigate to workspace root
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        pass
    
    # Try to read package.json version
    try:
        package_json_path = Path(__file__).parent.parent.parent.parent.parent / 'package.json'
        if package_json_path.exists():
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
                version = package_data.get('version')
                if version:
                    return version
    except (json.JSONDecodeError, FileNotFoundError, KeyError):
        pass
    
    # Fallback
    return "dev"


def health_check() -> Dict[str, Any]:
    """
    Generate health check response.
    
    Returns:
        Dict containing status, version, and ISO8601 timestamp
    """
    return {
        "status": "ok",
        "version": get_version(),
        "time": datetime.now(timezone.utc).isoformat()
    }


# Flask route example (uncomment if using Flask)
# from flask import Flask, jsonify
# 
# app = Flask(__name__)
# 
# @app.route('/health', methods=['GET'])
# def health():
#     return jsonify(health_check())


# FastAPI route example (uncomment if using FastAPI)
# from fastapi import FastAPI
# from fastapi.responses import JSONResponse
# 
# app = FastAPI()
# 
# @app.get("/health")
# async def health():
#     return JSONResponse(content=health_check())


# Django view example (uncomment if using Django)
# from django.http import JsonResponse
# 
# def health(request):
#     return JsonResponse(health_check())


if __name__ == "__main__":
    # For testing purposes
    result = health_check()
    print(json.dumps(result, indent=2))