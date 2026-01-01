from flask import Flask
from flask_cors import CORS
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

@app.route('/')
def home():
    return {"message": "SIEM Platform v1.0"}

@app.route('/api/health')
def health():
    return {"status": "healthy", "timestamp": "now"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
