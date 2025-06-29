from typing import Dict
import os

# Create product_images directory if it doesn't exist
os.makedirs("product_images", exist_ok=True)

# Sample genuine product image URLs
GENUINE_WALLET_IMAGES = [
    "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=2787&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=2787&auto=format&fit=crop"
]

# Test database with sample products
TEST_PRODUCTS: Dict = {
    "204-6984100-8009958": {
        "name": "Folding Step Stool",
        "barcode": "FSS2024001",
        "genuine_images": [
            "product_images/stool_genuine1.jpg"
        ],
        "features": {
            "logo_positions": [(50, 100)],
            "expected_patterns": ["CODE128"],
            "color_signature": [128, 128, 128],  # Gray plastic
            "texture_features": "plastic_matte"
        },
        "verification_rules": {
            "min_similarity_score": 0.75,
            "min_feature_matches": 50,
            "required_text_patterns": ["Folding", "Stool", "Non-Slip"],
            "color_tolerance": 20,
            "texture_threshold": 0.8
        }
    },
    "204-6984100-8009959": {
        "name": "Heavy Duty Step Stool",
        "barcode": "HSS2024001",
        "genuine_images": [
            "product_images/heavy_stool_genuine1.jpg"
        ],
        "features": {
            "logo_positions": [(50, 100)],
            "expected_patterns": ["CODE128"],
            "color_signature": [169, 169, 169],  # Industrial gray
            "texture_features": "industrial_texture"
        },
        "verification_rules": {
            "min_similarity_score": 0.75,
            "min_feature_matches": 50,
            "required_text_patterns": ["Heavy", "Duty", "Industrial"],
            "color_tolerance": 20,
            "texture_threshold": 0.8
        }
    },
    "204-6984100-8009960": {
        "name": "Premium Leather Wallet",
        "barcode": "LW2024GENUINE001",
        "genuine_images": [
            "product_images/leather_wallet_genuine1.jpg",
            "product_images/leather_wallet_genuine2.jpg"
        ],
        "features": {
            "logo_positions": [(100, 150)],
            "expected_patterns": ["CODE128", "QR"],
            "color_signature": [139, 69, 19],  # Brown leather RGB values
            "texture_features": "genuine_leather_grain"
        },
        "verification_rules": {
            "min_similarity_score": 0.75,
            "min_feature_matches": 50,
            "required_text_patterns": ["Genuine", "Leather", "Handcrafted"],
            "color_tolerance": 20,
            "texture_threshold": 0.8
        }
    }
}

# Sample verification results for testing
SAMPLE_RESULTS = {
    "authentic": {
        "similarity_score": 0.92,
        "feature_matches": 78,
        "text_matches": ["Genuine", "Leather", "Handcrafted"],
        "color_diff": 5.2,
        "texture_score": 0.95
    },
    "counterfeit": {
        "similarity_score": 0.45,
        "feature_matches": 12,
        "text_matches": ["Leather"],
        "color_diff": 25.8,
        "texture_score": 0.3
    }
}

# Download and save sample images
def setup_sample_images():
    """Download and save sample genuine product images"""
    import requests
    import shutil
    
    try:
        # Download wallet images
        for i, url in enumerate(GENUINE_WALLET_IMAGES, 1):
            image_path = f"product_images/leather_wallet_genuine{i}.jpg"
            if not os.path.exists(image_path):
                response = requests.get(url, stream=True)
                if response.status_code == 200:
                    with open(image_path, 'wb') as f:
                        shutil.copyfileobj(response.raw, f)
                    print(f"Downloaded {image_path}")
                else:
                    print(f"Failed to download image from {url}")
    except Exception as e:
        print(f"Error setting up sample images: {str(e)}")

# Setup sample images when module is imported
setup_sample_images() 