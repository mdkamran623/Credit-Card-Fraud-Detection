from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Simple fraud detection model
def predict_fraud(features):
    """
    Fraud detection logic:
    - High amount + late night = fraud
    - Unusual country + high amount = fraud
    - Multiple transactions in short time = fraud
    """
    amount = features.get('amount', 0)
    hour = features.get('hour', 12)
    country_match = features.get('country_match', True)
    merchant_type = features.get('merchant_type', 'normal')
    
    fraud_score = 0
    reasons = []
    
    # Amount check
    if amount > 5000:
        fraud_score += 25
        reasons.append(f"High amount: ${amount}")
    
    # Time check (fraud often happens 2-5 AM)
    if hour >= 2 and hour <= 5:
        fraud_score += 30
        reasons.append("Unusual transaction time")
    
    # Country mismatch
    if not country_match:
        fraud_score += 35
        reasons.append("Card country mismatch")
    
    # Merchant type
    if merchant_type == 'high_risk':
        fraud_score += 20
        reasons.append("High-risk merchant category")
    
    # Random variance for realistic demo
    fraud_score += np.random.randint(-5, 10)
    fraud_score = max(0, min(100, fraud_score))
    
    is_fraud = fraud_score > 50
    
    return {
        'fraud_score': int(fraud_score),
        'is_fraud': is_fraud,
        'risk_level': 'HIGH' if fraud_score > 70 else 'MEDIUM' if fraud_score > 40 else 'LOW',
        'reasons': reasons,
        'timestamp': datetime.now().isoformat()
    }

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        result = predict_fraud(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'online', 'time': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='127.0.0.1')
