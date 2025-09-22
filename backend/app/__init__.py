from flask import Flask, send_from_directory, send_file
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
CORS(app)

# Path to React build directory
REACT_BUILD_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../HiddenGems/dist')

@app.route('/')
def serve_react_app():
    return send_file(os.path.join(REACT_BUILD_PATH, 'index.html'))

@app.route('/<path:path>')
def serve_static_files(path):
    # Try to serve static files first
    try:
        return send_from_directory(REACT_BUILD_PATH, path)
    except FileNotFoundError:
        # If file not found, serve React app (for client-side routing)
        return send_file(os.path.join(REACT_BUILD_PATH, 'index.html'))

from app.api import bp as api_bp
app.register_blueprint(api_bp, url_prefix='/api')