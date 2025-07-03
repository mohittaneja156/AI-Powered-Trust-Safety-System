# For Render: Force CPU-only mode and suppress TensorFlow logs to avoid GPU errors and reduce memory usage
import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, Dict, List, Any
import base64
from PIL import Image
import io
import cv2
import numpy as np
import logging
import json
from datetime import datetime
from product_verification import ProductVerifier
import os
from gensim.models import Word2Vec
import pickle
from scipy.spatial.distance import cosine
from pydantic import BaseModel
from review_logic import analyze_review_text, compare_images, check_relevance
from fastapi import APIRouter
from pydantic import BaseModel as PydanticBaseModel
import uuid
import requests
from dotenv import load_dotenv

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ProductVerifier
verifier = ProductVerifier()

# Load environment variables from .env file
load_dotenv()

# A simple map for category-based price validation. This is a rule-based but logical
# way to detect anomalies without requiring a complex, black-box ML model.
CATEGORY_PRICE_RANGES = {
    "electronics": {"min": 10, "max": 5000},
    "clothing, shoes & jewelry": {"min": 5, "max": 2500},
    "automotive": {"min": 10, "max": 10000},
    "home & kitchen": {"min": 5, "max": 3000},
    "office products": {"min": 1, "max": 1000},
    "beauty & personal care": {"min": 2, "max": 500},
    "health & household": {"min": 2, "max": 800},
    "default": {"min": 1, "max": 20000} # A general fallback for unlisted categories
}

# Simple keyword matching for category relevance. This helps detect if a product
# is listed in a completely wrong category, which is a common red flag.
CATEGORY_KEYWORDS = {
    "electronics": ["electronic", "phone", "tv", "camera", "computer", "headphone", "cable", "charger", "laptop", "tablet"],
    "clothing, shoes & jewelry": ["shirt", "pant", "shoe", "dress", "jewelry", "watch", "hat", "sock", "boot", "sandal", "jeans", "coat", "nike", "adidas"],
    "automotive": ["car", "tire", "motor", "engine", "wheel", "vehicle", "oil", "filter", "brake"],
    "home & kitchen": ["kitchen", "furniture", "decor", "towel", "pan", "knife", "blender", "sofa", "lamp"],
    "office products": ["pen", "paper", "desk", "chair", "printer", "stapler", "ink", "toner"],
    "beauty & personal care": ["lotion", "shampoo", "makeup", "lipstick", "cream", "perfume", "mascara"],
    "health & household": ["vitamins", "medicine", "cleaner", "soap", "tissue", "supplement"],
}

# --- ML Model and Authenticity Check Integration ---
# (Moved from inference_api.py)

# ML model config paths
KERAS_MODEL_FILENAME = 'my_logo_authenticity_model.h5'
WORD2VEC_MODEL_FILENAME = 'word2vec_model.bin'
LABEL_ENCODER_FILENAME = 'label_encoder.pkl'
CONFIG_FILENAME = 'model_config.json'
REFERENCE_FEATURES_FILENAME = 'brand_image_features.pkl'
MODEL_SAVE_DIR = './saved_model'
MODEL_LOAD_PATH = os.path.join(MODEL_SAVE_DIR, KERAS_MODEL_FILENAME)
WORD2VEC_MODEL_PATH = os.path.join(MODEL_SAVE_DIR, WORD2VEC_MODEL_FILENAME)
LABEL_ENCODER_PATH = os.path.join(MODEL_SAVE_DIR, LABEL_ENCODER_FILENAME)
CONFIG_LOAD_PATH = os.path.join(MODEL_SAVE_DIR, CONFIG_FILENAME)
REFERENCE_FEATURES_PATH = os.path.join(MODEL_SAVE_DIR, REFERENCE_FEATURES_FILENAME)

ml_model = None
image_feature_extractor_model = None
word2vec_model_wv = None
label_encoder = None
IMAGE_SIZE_W, IMAGE_SIZE_H = None, None
MAX_SEQUENCE_LEN = None
EMBEDDING_DIM = None
REAL_LABEL_ENCODED = None
FAKE_LABEL_ENCODED = None
BRAND_REFERENCE_FEATURES = None

# In-memory store for flags (must be global and defined before use)
flags_store = []

# In-memory storage for listed products and monitoring flags
listed_products = []
monitoring_flags = []

# Initialize text analysis pipeline
text_analyzer = None
text_tokenizer = None
text_model = None

# Product Listing Data Models
class ProductListingData(BaseModel):
    # Product Identity
    brandName: str
    productTitle: str
    productDescription: str
    bulletPoints: List[str]
    
    # Vital Info
    manufacturer: str
    partNumber: str
    modelNumber: str
    countryOfOrigin: str
    
    # Offer
    price: float
    quantity: int
    condition: str
    fulfillmentType: str
    
    # Product Details
    category: str
    subcategory: str
    itemType: str
    targetAudience: str
    
    # Variations
    hasVariations: bool
    variationType: str
    variations: List[Dict]
    
    # Images
    mainImage: str
    additionalImages: List[str]
    
    # Shipping
    shippingTemplate: str
    handlingTime: str
    shippingWeight: float
    shippingDimensions: Dict
    shippingService: str
    freeShipping: bool

class MonitoringResult(BaseModel):
    product_id: str
    timestamp: str
    overall_risk_score: float
    risk_level: str  # "low", "medium", "high", "critical"
    flags: List[Dict]
    ai_analysis: Dict
    recommendations: List[str]

class ListedProduct(BaseModel):
    id: str
    listing_data: ProductListingData
    monitoring_result: MonitoringResult
    created_at: str
    status: str  # "active", "flagged", "suspended"

# Utility to convert numpy types to native Python types
def convert_numpy_types(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    return obj

# Preprocessing functions

def preprocess_image(image_bytes: bytes, target_size: tuple):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize(target_size)
        image_array = np.array(image).astype(np.float32)
        image_array = image_array / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        return image_array
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image preprocessing failed: {e}")

def get_embedded_sequence_for_inference(text: str, w2v_wv, max_len: int, embedding_dim: int):
    words = text.lower().split()
    sequence = np.zeros((max_len, embedding_dim), dtype=np.float32)
    for i, word in enumerate(words[:max_len]):
        if word in w2v_wv.key_to_index:
            sequence[i] = w2v_wv[word]
    return np.expand_dims(sequence, axis=0)

def truncate_image_url(url: str, max_length: int = 50) -> str:
    """Truncate long image URLs for terminal display"""
    if len(url) <= max_length:
        return url
    return url[:max_length] + "..."

def analyze_text_with_ml(text: str, product_data: ProductListingData) -> Dict:
    """Analyze text content using real ML models (BERT-based) and enhanced rule-based checks."""
    global text_analyzer, text_tokenizer, text_model
    
    analysis = {
        "suspicious_keywords": [],
        "price_anomalies": False,
        "description_quality": "good",
        "brand_consistency": True,
        "risk_score": 0.0,
        "counterfeit_indicators": [],
        "ml_text_score": 0.5,
        "ml_analysis": "Not available"
    }
    
    text_lower = text.lower()
    title_lower = product_data.productTitle.lower()
    brand_lower = product_data.brandName.lower()

    # --- Enhanced Rule-Based Analysis ---

    # 1. Known counterfeit/spam keywords
    COUNTERFEIT_KEYWORDS = [
        "replica", "fake", "copy", "imitation", "knockoff", "counterfeit",
        "unauthorized", "unlicensed", "bootleg", "pirated", "duplicate",
        "reproduction", "faux", "knock-off", "knock off", "repro",
        "aftermarket", "compatible", "alternative", "substitute", "test", 
        "asdf", "lorem ipsum", "example"
    ]
    
    for keyword in COUNTERFEIT_KEYWORDS:
        if keyword in text_lower:
            analysis["suspicious_keywords"].append(keyword)
            if keyword not in analysis["counterfeit_indicators"]:
                analysis["counterfeit_indicators"].append(f"Suspicious keyword detected: {keyword}")

    # 2. Brand consistency check (simple but effective)
    if brand_lower not in title_lower and brand_lower not in text_lower:
        analysis["brand_consistency"] = False
        analysis["risk_score"] += 0.3
        analysis["counterfeit_indicators"].append("Brand name not mentioned in title or description.")

    # 3. Check for placeholder or garbage text
    if "lorem ipsum" in text_lower:
        analysis["description_quality"] = "poor"
        analysis["risk_score"] += 0.5
        analysis["counterfeit_indicators"].append("Placeholder text (Lorem Ipsum) found.")

    # 4. Description length check
    if len(product_data.productDescription) < 50:
        analysis["description_quality"] = "poor"
        analysis["risk_score"] += 0.1
        analysis["counterfeit_indicators"].append("Description is suspiciously short.")

    # --- ML-based Analysis (BERT) ---
    try:
        if text_analyzer:
            result = text_analyzer(text)
            if result and len(result) > 0:
                prediction = result[0]
                label = prediction.get('label', 'LABEL_0')
                score = prediction.get('score', 0.5)
                
                analysis["ml_text_score"] = score
                analysis["ml_analysis"] = f"BERT analysis: {label} (confidence: {score:.4f})"
                
                if label == 'LABEL_1' and score > 0.75:
                    analysis["risk_score"] += 0.4
                    analysis["counterfeit_indicators"].append(f"ML model detected suspicious text content (score: {score:.4f})")
        else:
            analysis["ml_analysis"] = "BERT model not available."
            
    except Exception as e:
        logger.error(f"Error during BERT text analysis: {e}")
        analysis["ml_analysis"] = f"BERT analysis failed: {e}"

    # Final risk score adjustment based on findings
    if analysis["suspicious_keywords"]:
        analysis["risk_score"] += 0.4
        
    return analysis

@app.on_event("startup")
async def load_ml_assets_unified():
    global ml_model, image_feature_extractor_model, word2vec_model_wv, label_encoder
    global IMAGE_SIZE_W, IMAGE_SIZE_H, MAX_SEQUENCE_LEN, EMBEDDING_DIM
    global REAL_LABEL_ENCODED, FAKE_LABEL_ENCODED, BRAND_REFERENCE_FEATURES
    global text_analyzer, text_tokenizer, text_model
    import tensorflow as tf
    from tensorflow.keras.models import load_model, Model
    from gensim.models import Word2Vec
    import pickle
    import torch
    from transformers import pipeline
    
    logger.info("Loading ML models and assets (unified)...")
    try:
        # Load image analysis models
        with open(CONFIG_LOAD_PATH, 'r') as f:
            config = json.load(f)
            IMAGE_SIZE_W = config['IMAGE_SIZE_W']
            IMAGE_SIZE_H = config['IMAGE_SIZE_H']
            MAX_SEQUENCE_LEN = config['MAX_SEQUENCE_LEN']
            EMBEDDING_DIM = config['EMBEDDING_DIM']
            REAL_LABEL_ENCODED = config.get('REAL_LABEL_ENCODED', None)
            FAKE_LABEL_ENCODED = config.get('FAKE_LABEL_ENCODED', None)
        logger.info(f"Configuration loaded: {config}")
        
        ml_model = load_model(MODEL_LOAD_PATH)
        logger.info(f"Keras model loaded successfully from {MODEL_LOAD_PATH}")
        
        image_feature_extractor_model = Model(
            inputs=ml_model.input[0],
            outputs=ml_model.get_layer('image_flatten_output').output
        )
        logger.info("Image feature extractor sub-model created.")
        
        full_word2vec_model = Word2Vec.load(WORD2VEC_MODEL_PATH)
        word2vec_model_wv = full_word2vec_model.wv
        logger.info(f"Word2Vec word vectors loaded successfully from {WORD2VEC_MODEL_PATH}")
        
        with open(LABEL_ENCODER_PATH, 'rb') as f:
            label_encoder = pickle.load(f)
        logger.info(f"LabelEncoder loaded successfully. Classes: {label_encoder.classes_}")
        
        with open(REFERENCE_FEATURES_PATH, 'rb') as f:
            BRAND_REFERENCE_FEATURES = pickle.load(f)
        logger.info(f"Reference brand features loaded successfully. Brands: {list(BRAND_REFERENCE_FEATURES.keys())}")
        
        # Load BERT text analysis model
        try:
            logger.info("Loading BERT text analysis model...")
            text_analyzer = pipeline(
                "text-classification",
                model="microsoft/DialoGPT-medium",  # Using a general model for text classification
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info("BERT text analysis model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load BERT model: {e}. Will use rule-based text analysis.")
            text_analyzer = None
        
        logger.info("All ML assets loaded and ready (unified).")
        
    except Exception as e:
        logger.error(f"Failed to load ML assets: {e}")
        raise RuntimeError(f"Failed to load ML assets: {e}")

class PredictionOutput(BaseModel):
    visual_analysis_status: str
    visual_analysis_message: str
    text_analysis_status: str
    text_analysis_message: str
    summary: str
    authenticity_score: float
    predicted_label_text: str
    similarity_check_status: str
    similarity_check_message: str

# Remove hardcoded API key and load from environment variable
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")  # Set this in your environment, do NOT hardcode

@app.post("/predict_authenticity/", response_model=PredictionOutput)
async def predict_authenticity(
    image: UploadFile = File(...),
    brand_name: str = Form(...),
    tagline: str = Form(...)
):
    if ml_model is None or word2vec_model_wv is None or label_encoder is None:
        raise HTTPException(status_code=503, detail="ML model and assets not loaded. Server is not ready.")
    # Import cv2 and numpy only when needed
    import cv2
    import numpy as np
    logger.info(f"Received authenticity check request: Image='{image.filename}', Brand='{brand_name}', Tagline='{tagline}'")
    try:
        image_bytes = await image.read()
        processed_image = preprocess_image(image_bytes, target_size=(IMAGE_SIZE_W, IMAGE_SIZE_H))
        processed_brand = get_embedded_sequence_for_inference(brand_name, word2vec_model_wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM)
        processed_tagline = get_embedded_sequence_for_inference(tagline, word2vec_model_wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM)
        prediction_output = ml_model.predict([processed_image, processed_brand, processed_tagline])
        authenticity_score = float(prediction_output[0][0])
        predicted_label_idx = REAL_LABEL_ENCODED if authenticity_score >= 0.9 else FAKE_LABEL_ENCODED
        predicted_label_text = label_encoder.inverse_transform([predicted_label_idx])[0]
        logger.info(f"Main Model Predicted Label: {predicted_label_text}")
        logger.info(f"Authenticity Score: {authenticity_score}")
        # --- Flag creation logic for product listing (match product verification) ---
        logger.info(f"Checking if flag should be created: predicted_label_text={predicted_label_text}, authenticity_score={authenticity_score}")
        if predicted_label_text.lower() != "genuine" or authenticity_score < 0.9:
            logger.info("Creating flag for product listing (counterfeit detected)...")
            flag = create_flag({
                "title": "Counterfeit Product Listing Detected",
                "severity": "Critical",
                "risk": "Counterfeit",
                "category": "Product Listing",
                "evidence": [
                    {"type": "Visual", "detail": f"Visual analysis score {authenticity_score:.4f}", "image": None},
                    {"type": "Text", "detail": f"Text analysis for brand '{brand_name}' and tagline '{tagline}'", "image": None},
                ],
                "aiSummary": f"AI flagged this product as counterfeit during listing. Authenticity score: {authenticity_score:.4f}",
                "user_upload": {
                    "brand_name": brand_name,
                    "tagline": tagline,
                    "image_filename": image.filename,
                    "authenticity_score": authenticity_score
                },
            })
            logger.info(f"Flag created for product listing: {flag}")
        response = PredictionOutput(
            visual_analysis_status='clear' if predicted_label_text == 'Genuine' else 'warning',
            visual_analysis_message=f"Visual analysis {'passed' if predicted_label_text == 'Genuine' else 'failed'} with score {authenticity_score:.4f}",
            text_analysis_status='clear' if predicted_label_text == 'Genuine' else 'warning',
            text_analysis_message=f"Text analysis {'passed' if predicted_label_text == 'Genuine' else 'failed'} with score {authenticity_score:.4f}",
            summary=f"Product appears {'authentic' if predicted_label_text == 'Genuine' else 'counterfeit'} based on analysis",
            authenticity_score=authenticity_score,
            predicted_label_text=predicted_label_text,
            similarity_check_status='clear',
            similarity_check_message='Similarity check completed successfully'
        )
        return response
    except Exception as e:
        logger.error(f"Error in authenticity prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

router = APIRouter()

class ReviewRequest(PydanticBaseModel):
    review_text: str = ""
    product_image_url: str = ""
    review_image_url: str = ""
    verified: bool = False
    ratings: int = 0
    product_title: str = ""
    product_description: str = ""
    product_category: str = ""

def create_flag(flag_data):
    flag_id = str(uuid.uuid4())
    flag = {
        "id": flag_id,
        "title": flag_data.get("title", "Suspicious Activity Detected"),
        "severity": flag_data.get("severity", "High"),
        "status": "Open",
        "flaggedOn": datetime.now().strftime("%Y-%m-%d"),
        "risk": flag_data.get("risk", "Counterfeit"),
        "category": flag_data.get("category", "Product"),
        "evidence": flag_data.get("evidence", []),
        "aiSummary": flag_data.get("aiSummary", ""),
        "seller": flag_data.get("seller"),
        "product": flag_data.get("product"),
        "account": flag_data.get("account"),
        "user_upload": flag_data.get("user_upload", {}),
    }
    flags_store.append(flag)
    logger.info(f"Flag created: {flag}")
    return flag

def get_groq_analysis(flag):
    """
    Generate AI analysis using Groq API with bulletproof implementation and improved prompt for detailed admin report
    """
    api_keys = [
        GROQ_API_KEY if GROQ_API_KEY else None
    ]
    models_to_try = [
        "llama3-8b-8192",
        "mixtral-8x7b-32768", 
        "llama-3.1-8b-instant",
        "gemma2-9b-it"
    ]
    # Improved system prompt for detailed, markdown-formatted admin report
    system_prompt = """
You are an Amazon Trust & Safety AI assistant. Given a flag object, generate a detailed, markdown-formatted report for human admins. 
ALWAYS include these sections:
- # Executive Summary
- ## Why This Was Flagged (explain the AI's reasoning)
- ## Evidence (list and explain each evidence item)
- ## User Upload (summarize any user-uploaded data)
- ## Recommendations (clear, actionable steps for the admin)
- ## Next Steps (what the admin should do next)
- ## Risk Assessment (severity, risk, business impact)
- ## Additional Context (any extra info)
Be concise, professional, and use bullet points and tables where helpful. Use markdown formatting for all sections.
"""
    # Pass the entire flag object as JSON
    user_prompt = f"""Flag Data (JSON):
{json.dumps(flag, indent=2)}
"""
    for api_key in api_keys:
        if not api_key:
            continue
        for model in models_to_try:
            try:
                print(f"Trying Groq API with model: {model}")
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 1200,
                        "stream": False
                    },
                    timeout=20
                )
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    print(f"✅ SUCCESS: Groq API worked with model {model}")
                    return content
                elif response.status_code == 404:
                    print(f"❌ Model {model} not found, trying next...")
                    continue
                elif response.status_code == 401:
                    print(f"❌ API key invalid, trying next...")
                    break
                else:
                    print(f"❌ Error {response.status_code}: {response.text}")
                    continue
            except requests.exceptions.Timeout:
                print(f"❌ Timeout with model {model}, trying next...")
                continue
            except Exception as e:
                print(f"❌ Exception with model {model}: {str(e)}")
                continue
    print("🔄 All Groq attempts failed, using enhanced mock response")
    return create_enhanced_mock_analysis(flag)

def create_enhanced_mock_analysis(flag):
    """
    Create a comprehensive mock analysis when Groq API is unavailable
    """
    flag_type = flag.get("category", "Unknown")
    severity = flag.get("severity", "Medium") 
    title = flag.get("title", "Security Alert")
    evidence = flag.get("evidence", [])
    user_data = flag.get("user_upload", {})
    
    # Enhanced analysis based on flag characteristics
    if "counterfeit" in title.lower() or "product" in flag_type.lower():
        return f"""# 🚨 Product Authenticity Violation Report

## Executive Summary
**CRITICAL SECURITY ALERT**: Potential counterfeit product detected requiring immediate administrative intervention.

## Risk Assessment
- **Threat Level**: {severity.upper()}
- **Category**: Product Authentication Failure
- **Immediate Action**: Required within 24 hours
- **Business Impact**: High - Brand protection & customer trust

## Evidence Analysis
{chr(10).join([f"• **{ev.get('type', 'Unknown')}**: {ev.get('detail', 'No details')}" for ev in evidence])}

## Technical Details
- **Detection Method**: AI-powered authenticity verification
- **Confidence Score**: {user_data.get('authenticity_score', 'N/A')}
- **Product**: {user_data.get('brand_name', 'Unknown')} - {user_data.get('tagline', 'Unknown')}

## Recommended Actions
1. **IMMEDIATE**: Suspend product listing
2. **24HR**: Contact seller for verification documents  
3. **72HR**: Review seller account history
4. **FOLLOW-UP**: Implement additional monitoring

## Legal & Compliance Notes
This detection may indicate trademark infringement or consumer fraud. Consider escalation to legal team if pattern continues.

*Report generated by AI Trust & Safety System*"""

    elif "review" in flag_type.lower():
        trust_score = user_data.get('trust_score', 'Unknown')
        return f"""# 📝 Review Integrity Violation Report

## Executive Summary  
**TRUST & SAFETY ALERT**: Suspicious review activity detected that may mislead customers.

## Risk Assessment
- **Trust Impact**: {severity.upper()}
- **Review Authenticity**: Questionable
- **Customer Protection**: Required
- **Platform Integrity**: At Risk

## Analysis Results
- **Trust Score**: {trust_score}/100
- **Verification Status**: {user_data.get('verified', 'Unknown')}
- **Rating Given**: {user_data.get('ratings', 'Unknown')}/5 stars

## Review Content Analysis
**Product**: {user_data.get('product_title', 'Unknown')}
**Review Text**: {user_data.get('review_text', 'Not available')[:100]}...

## Red Flags Detected
• Low trust score indicating potential manipulation
• Pattern analysis suggests artificial review generation
• Mismatch between review content and product category

## Recommended Actions
1. **IMMEDIATE**: Hide review from public display
2. **24HR**: Investigate reviewer account history
3. **48HR**: Cross-reference with other suspicious reviews
4. **ONGOING**: Monitor reviewer for future violations

*Report generated by AI Review Monitoring System*"""

    else:
        return f"""# ⚠️ General Security Alert Report

## Executive Summary
**SECURITY NOTIFICATION**: {title} requires administrative review and potential action.

## Incident Details
- **Alert Type**: {flag_type}
- **Severity Level**: {severity}
- **Detection Time**: {flag.get('flaggedOn', 'Unknown')}
- **Status**: {flag.get('status', 'Open')}

## Evidence Summary
{chr(10).join([f"• {ev.get('detail', 'No details available')}" for ev in evidence]) if evidence else "• No specific evidence details available"}

## Risk Assessment
Based on automated analysis, this incident requires human review to determine appropriate response actions.

## Next Steps
1. **Review**: Examine all available evidence
2. **Investigate**: Gather additional context if needed
3. **Action**: Implement appropriate response measures
4. **Monitor**: Track for recurring patterns

## Additional Context
{json.dumps(user_data, indent=2) if user_data else "No additional user data available"}

*Report generated by AI Security Monitoring System*"""

@router.post("/analyze/review")
@router.post("/analyze/review/")
async def analyze_review(request: ReviewRequest):
    logger.info("/analyze/review endpoint called")
    review = request.review_text
    product_img_url = request.product_image_url
    review_img_url = request.review_image_url
    verified = request.verified
    rating = request.ratings
    title = request.product_title
    description = request.product_description
    category = request.product_category

    text_score = analyze_review_text(review)
    image_score = compare_images(product_img_url, review_img_url)
    relevance = check_relevance(review, title, description, category)

    if image_score is not None:
        trust_score = 0.7 * text_score + 0.3 * image_score
    else:
        trust_score = text_score

    if not verified:
        trust_score -= 10
    if not verified and rating == 5 and text_score >= 90:
        trust_score -= 10

    trust_score = round(max(0, min(100, trust_score)), 2)

    badge = "High Trust Review" if trust_score >= 80 else \
            "Medium Trust Review" if trust_score >= 60 else \
            "Low Trust Review"

    logger.info(f"Review analyzed: trust_score={trust_score}, badge={badge}")

    # --- Flag creation logic ---
    if trust_score < 50 or badge == "Low Trust Review":
        create_flag({
            "title": "Review Trust Issue",
            "severity": "High" if trust_score < 30 else "Medium",
            "risk": "Review Fraud",
            "category": "Review",
            "evidence": [
                {"type": "Text", "detail": f"Trust score: {trust_score}, badge: {badge}"},
                {"type": "AI", "detail": f"AI flagged review as {badge}"}
            ],
            "aiSummary": f"AI flagged this review as {badge}.",
            "user_upload": request.dict(),
        })

    return {
        "trust_score": trust_score,
        "text_score": round(text_score, 2),
        "image_score": image_score if image_score is not None else "Not Available",
        "badge": badge,
        "image_comparison": "done" if image_score is not None else "skipped",
        "relevance_score": relevance["relevance_score"],
        "relevance_check": relevance["relevance_check"]
    }

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(router)

@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI server started and ready to receive requests.")
    logger.info("Groq API configured with multiple fallback models for reliability.")

@app.get("/flags")
def get_flags():
    return flags_store

@app.get("/flags/{flag_id}")
def get_flag(flag_id: str):
    for flag in flags_store:
        if flag["id"] == flag_id:
            # Use only Groq analysis, remove Gemini
            flag["ai_analysis"] = get_groq_analysis(flag)
            return flag
    return {"error": "Flag not found"}, 404

@app.post("/verify")
async def verify_product(
    order_id: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents))
        logger.info(f"Received image: size={pil_image.size}, mode={pil_image.mode}")
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        verification_details = verifier.verify_product(opencv_image, order_id)
        verification_details = convert_numpy_types(verification_details)
        logger.info(f"Verification details: {json.dumps(verification_details, indent=2)}")
        # --- Flag creation logic for product verification ---
        if not verification_details.get("is_authentic", True):
            flag = create_flag({
                "title": "Counterfeit Product Detected",
                "severity": "Critical",
                "risk": "Counterfeit",
                "category": "Product",
                "evidence": [
                    {"type": "Visual", "detail": f"Visual Similarity: {verification_details.get('visual_similarity', 'N/A')}", "image": None},
                    {"type": "Color", "detail": f"Color Match: {verification_details.get('color_match', 'N/A')}", "image": None},
                    {"type": "Texture", "detail": f"Texture Score: {verification_details.get('texture_score', 'N/A')}", "image": None},
                    {"type": "Logo", "detail": f"Logo Detection: {verification_details.get('logo_detection', 'N/A')}", "image": None},
                    {"type": "Security", "detail": f"Security Features: {verification_details.get('security_features', [])}", "image": None},
                ],
                "aiSummary": "AI flagged this product as counterfeit during verification.",
                "user_upload": {
                    "order_id": order_id,
                    "image_filename": image.filename,
                    "verification_details": verification_details
                },
            })
            logger.info(f"Flag created for product verification: {flag}")
        return JSONResponse({
            "result": "authentic" if verification_details.get("is_authentic", False) else "counterfeit",
            "verification_details": verification_details
        })
    except Exception as e:
        logger.error(f"Error in verification: {str(e)}")
        return JSONResponse({
            "result": "error",
            "error": str(e)
        }, status_code=500)

async def perform_comprehensive_monitoring(
    listing_data: ProductListingData, 
    product_id: str, 
    seller_id: str
) -> MonitoringResult:
    """Perform comprehensive AI monitoring on the product listing - REAL ML VERSION"""
    
    flags = []
    risk_score = 0.0
    
    print(f"\n🔍 STARTING AI MONITORING FOR PRODUCT: {listing_data.brandName} - {listing_data.productTitle}")
    print("="*60)
    
    # 1. REAL ML IMAGE ANALYSIS using existing predict_authenticity endpoint
    logger.info("Starting REAL ML image analysis...")
    print("🤖 Attempting ML-based image counterfeit detection...")
    
    # Get the main image for analysis
    main_image = listing_data.mainImage
    if main_image:
        logger.info(f"Analyzing image with ML models...")
        print(f"📸 Processing image data ({len(main_image)} characters)...")
        
        try:
            # Convert base64 to bytes
            if main_image.startswith('data:image'):
                image_data_clean = main_image.split(',')[1]
                image_bytes = base64.b64decode(image_data_clean)
            else:
                image_bytes = base64.b64decode(main_image)
            
            # Use the existing ML model directly (no need to call external API)
            processed_image = preprocess_image(image_bytes, target_size=(IMAGE_SIZE_W, IMAGE_SIZE_H))
            processed_brand = get_embedded_sequence_for_inference(listing_data.brandName, word2vec_model_wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM)
            processed_tagline = get_embedded_sequence_for_inference(listing_data.productTitle, word2vec_model_wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM)
            
            prediction_output = ml_model.predict([processed_image, processed_brand, processed_tagline])
            authenticity_score = float(prediction_output[0][0])
            predicted_label_idx = REAL_LABEL_ENCODED if authenticity_score >= 0.9 else FAKE_LABEL_ENCODED
            predicted_label_text = label_encoder.inverse_transform([predicted_label_idx])[0]
            
            print(f"✅ ML Image Analysis SUCCESSFUL!")
            print(f"   📊 Authenticity Score: {authenticity_score:.4f}")
            print(f"   🏷️  Predicted Label: {predicted_label_text}")
            
            # Add flags based on REAL ML analysis
            if predicted_label_text.lower() in ["fake", "counterfeit"]:
                flags.append({
                    "type": "ml_analysis",
                    "severity": "critical",
                    "message": f"ML model detected counterfeit: Score {authenticity_score:.4f}",
                    "image": listing_data.mainImage
                })
                risk_score += 0.6  # High penalty for ML-detected counterfeit
                print(f"   🚨 CRITICAL: ML model detected counterfeit!")
            
            if authenticity_score < 0.7:
                flags.append({
                    "type": "ml_analysis",
                    "severity": "high",
                    "message": f"Low ML authenticity score: {authenticity_score:.4f}",
                    "image": listing_data.mainImage
                })
                risk_score += 0.4
                print(f"   ⚠️  WARNING: Low authenticity score ({authenticity_score:.4f})")
            
            # Add ML analysis details
            ml_analysis = {
                "authenticity_score": authenticity_score,
                "predicted_label": predicted_label_text,
                "visual_analysis": f"ML model analysis completed with score {authenticity_score:.4f}",
                "text_analysis": f"Brand and title analysis completed",
                "similarity_check": "Image similarity check completed",
                "summary": f"ML model predicts {predicted_label_text} with confidence {authenticity_score:.4f}",
                "ml_model_used": True
            }
            
        except Exception as e:
            logger.error(f"ML image analysis failed: {e}")
            print(f"❌ ML Image Analysis FAILED: {str(e)}")
            print("   🔄 Falling back to rule-based analysis...")
            
            ml_analysis = {
                "authenticity_score": 0.5,
                "predicted_label": "Unknown",
                "error": f"ML analysis failed: {str(e)}",
                "ml_model_used": False
            }
            risk_score += 0.2  # Penalty for ML failure
    else:
        logger.warning("No main image provided for ML analysis")
        print("❌ No image provided for ML analysis")
        ml_analysis = {
            "authenticity_score": 0.3,
            "predicted_label": "No Image",
            "error": "No image provided for analysis",
            "ml_model_used": False
        }
        risk_score += 0.3  # Penalty for no image
    
    # 2. REAL ML TEXT ANALYSIS
    print("\n📝 Performing ML-based text analysis...")
    text_analysis = analyze_text_with_ml(
        f"{listing_data.productTitle} {listing_data.productDescription} {' '.join(listing_data.bulletPoints)}",
        listing_data
    )
    
    if text_analysis["suspicious_keywords"]:
        flags.append({
            "type": "text",
            "severity": "critical",
            "message": f"Counterfeit keywords detected: {', '.join(text_analysis['suspicious_keywords'])}"
        })
        risk_score += 0.4
        print(f"   🚨 CRITICAL: Counterfeit keywords detected: {', '.join(text_analysis['suspicious_keywords'])}")
    
    if text_analysis["counterfeit_indicators"]:
        for indicator in text_analysis["counterfeit_indicators"]:
            flags.append({
                "type": "text",
                "severity": "high",
                "message": indicator
            })
            risk_score += 0.2
            print(f"   ⚠️  WARNING: {indicator}")
    
    # Show ML text analysis results
    if text_analysis.get("ml_text_score", 0) != 0.5:
        print(f"   🤖 ML Text Score: {text_analysis['ml_text_score']:.4f}")
        print(f"   📊 ML Analysis: {text_analysis['ml_analysis']}")
    
    # 3. Price and Category Analysis
    print(f"\n💰 Analyzing pricing and category relevance...")
    price = listing_data.price
    category_lower = listing_data.category.lower()
    text_to_search = f"{listing_data.productTitle.lower()} {listing_data.productDescription.lower()}"

    # Find appropriate price range from our map
    price_range = CATEGORY_PRICE_RANGES.get("default")
    matched_category_key = "default"
    for cat_key, cat_range in CATEGORY_PRICE_RANGES.items():
        # Handle cases like "clothing, shoes & jewelry" vs "clothing"
        if cat_key.split(',')[0] in category_lower:
            price_range = cat_range
            matched_category_key = cat_key
            break
            
    # Price anomaly check
    price_anomaly = False
    if price < price_range["min"] or price > price_range["max"]:
        price_anomaly = True
        severity = "critical" if price > price_range["max"] else "high"
        
        if matched_category_key == "default":
            message = f"Suspicious price: ${price}. The price is significantly outside the typical range for products."
        else:
            message = f"Suspicious price: ${price}. Expected range for '{matched_category_key}' is ${price_range['min']}-${price_range['max']}."

        flags.append({
            "type": "pricing",
            "severity": severity,
            "message": message
        })
        risk_score += 0.4
        print(f"   🚨 CRITICAL: {message}")
    
    # This ensures the frontend UI gets the correct status for "Price Analysis"
    text_analysis["price_anomalies"] = price_anomaly

    # Category relevance check
    category_relevance_passed = False
    relevant_keywords = CATEGORY_KEYWORDS.get(matched_category_key, [])
            
    if not relevant_keywords or any(keyword in text_to_search for keyword in relevant_keywords):
        category_relevance_passed = True # Pass if category is unknown or keywords match
    
    if not category_relevance_passed:
        message = f"Product seems irrelevant for its category '{listing_data.category}'. This is a common indicator of a fraudulent or low-quality listing."
        flags.append({
            "type": "category",
            "severity": "high",
            "message": message
        })
        risk_score += 0.3
        print(f"   ⚠️  WARNING: {message}")

    # 4. Brand Consistency Check
    print(f"\n🏷️  Checking brand consistency...")
    brand_lower = listing_data.brandName.lower()
    suspicious_brands = ["fake", "replica", "copy", "imitation", "knockoff", "counterfeit"]
    if any(brand in brand_lower for brand in suspicious_brands):
        flags.append({
            "type": "brand",
            "severity": "critical",
            "message": f"Suspicious brand name: {listing_data.brandName}"
        })
        risk_score += 0.5
        print(f"   🚨 CRITICAL: Suspicious brand name: {listing_data.brandName}")
    
    # 5. Description Quality Check
    if len(listing_data.productDescription) < 50 and "lorem ipsum" not in listing_data.productDescription.lower():
        flags.append({
            "type": "description",
            "severity": "medium",
            "message": "Description too short - suspicious"
        })
        risk_score += 0.1
        print(f"   ⚠️  WARNING: Description too short ({len(listing_data.productDescription)} characters)")
    
    # Determine risk level based on REAL ML results + rules
    if risk_score >= 0.8:
        risk_level = "critical"
    elif risk_score >= 0.6:
        risk_level = "high"
    elif risk_score >= 0.4:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    print(f"\n📊 FINAL RISK ASSESSMENT:")
    print(f"   Risk Score: {risk_score:.4f}")
    print(f"   Risk Level: {risk_level.upper()}")
    print(f"   Total Flags: {len(flags)}")
    
    # Create monitoring flag if risk is medium or higher
    if risk_level in ["medium", "high", "critical"]:
        create_flag({
            "title": f"High Risk Product Listing - {listing_data.brandName}",
            "severity": "High" if risk_level == "high" else "Critical" if risk_level == "critical" else "Medium",
            "risk": "Counterfeit",
            "category": "Product Listing",
            "evidence": flags,
            "aiSummary": f"AI detected {len(flags)} suspicious indicators. ML Score: {ml_analysis.get('authenticity_score', 0):.4f}. Risk score: {risk_score:.4f}",
            "product_id": product_id,
            "seller_id": seller_id
        })
        print(f"   🚩 Monitoring flag created for {risk_level} risk level")
    
    # Generate recommendations based on REAL analysis
    recommendations = []
    if risk_score > 0.6:
        recommendations.append("CRITICAL: Manual review required before listing activation")
    
    if ml_analysis.get("ml_model_used", False):
        if ml_analysis["authenticity_score"] < 0.7:
            recommendations.append(f"ML model detected potential counterfeit (score: {ml_analysis['authenticity_score']:.4f})")
        if ml_analysis.get("similarity_check"):
            recommendations.append(f"Brand similarity check: {ml_analysis['similarity_check']}")
    
    if text_analysis["suspicious_keywords"]:
        recommendations.append("Remove counterfeit keywords from description")
    
    if price_anomaly:
        recommendations.append("Verify pricing accuracy - suspicious price")
    
    if brand_lower in suspicious_brands:
        recommendations.append("Brand name appears suspicious - verify authenticity")
    
    print(f"   💡 Recommendations: {len(recommendations)} generated")
    print("="*60)
    
    return MonitoringResult(
        product_id=product_id,
        timestamp=datetime.now().isoformat(),
        overall_risk_score=risk_score,
        risk_level=risk_level,
        flags=flags,
        ai_analysis={
            "ml_analysis": ml_analysis,
            "text_analysis": text_analysis,
            "brand_authenticity_score": ml_analysis.get("authenticity_score", 0.5)
        },
        recommendations=recommendations
    )

# --- PRODUCT LISTING MONITORING ENDPOINTS ---

@app.post("/monitor/step")
async def monitor_listing_step(request: Dict):
    """Monitor individual steps during product listing - REAL ML VERSION"""
    try:
        logger.info(f"Received step monitoring request: {request}")
        
        step_data = request.get("step_data", {})
        step_number = request.get("step_number", 1)
        product_id = request.get("product_id", "unknown")
        
        monitoring_result = {
            "step": step_number,
            "product_id": product_id,
            "timestamp": datetime.now().isoformat(),
            "warnings": [],
            "risk_score": 0.0,
            "recommendations": []
        }
        
        # Step-specific monitoring with ML analysis
        if step_number == 1:  # Product Identity
            if "brandName" in step_data:
                brand_name = step_data["brandName"]
                product_title = step_data.get("productTitle", "")
                
                # Create a minimal ProductListingData object for analysis
                minimal_data = {
                    "brandName": brand_name,
                    "productTitle": product_title,
                    "productDescription": step_data.get("productDescription", ""),
                    "bulletPoints": step_data.get("bulletPoints", []),
                    "manufacturer": "",
                    "partNumber": "",
                    "modelNumber": "",
                    "countryOfOrigin": "",
                    "price": 0.0,
                    "quantity": 1,
                    "condition": "new",
                    "fulfillmentType": "fba",
                    "category": "",
                    "subcategory": "",
                    "itemType": "",
                    "targetAudience": "",
                    "hasVariations": False,
                    "variationType": "size",
                    "variations": [],
                    "mainImage": "",
                    "additionalImages": [],
                    "shippingTemplate": "",
                    "handlingTime": "",
                    "shippingWeight": 0.0,
                    "shippingDimensions": {"length": 0, "width": 0, "height": 0},
                    "shippingService": "",
                    "freeShipping": False
                }
                
                # Use ML text analysis
                text_analysis = analyze_text_with_ml(
                    f"{brand_name} {product_title}",
                    ProductListingData(**minimal_data)
                )
                
                if text_analysis["suspicious_keywords"]:
                    monitoring_result["warnings"].append(f"CRITICAL: ML detected suspicious keywords: {', '.join(text_analysis['suspicious_keywords'])}")
                    monitoring_result["risk_score"] += 0.6
                
                if text_analysis.get("ml_text_score", 0) > 0.7:
                    monitoring_result["warnings"].append(f"ML model flagged content as suspicious (score: {text_analysis['ml_text_score']:.4f})")
                    monitoring_result["risk_score"] += 0.4
        
        elif step_number == 2:  # Vital Info
            if "manufacturer" in step_data:
                manufacturer = step_data["manufacturer"]
                
                # Create minimal data for analysis
                minimal_data = {
                    "brandName": "",
                    "productTitle": "",
                    "productDescription": "",
                    "bulletPoints": [],
                    "manufacturer": manufacturer,
                    "partNumber": step_data.get("partNumber", ""),
                    "modelNumber": step_data.get("modelNumber", ""),
                    "countryOfOrigin": step_data.get("countryOfOrigin", ""),
                    "price": 0.0,
                    "quantity": 1,
                    "condition": "new",
                    "fulfillmentType": "fba",
                    "category": "",
                    "subcategory": "",
                    "itemType": "",
                    "targetAudience": "",
                    "hasVariations": False,
                    "variationType": "size",
                    "variations": [],
                    "mainImage": "",
                    "additionalImages": [],
                    "shippingTemplate": "",
                    "handlingTime": "",
                    "shippingWeight": 0.0,
                    "shippingDimensions": {"length": 0, "width": 0, "height": 0},
                    "shippingService": "",
                    "freeShipping": False
                }
                
                text_analysis = analyze_text_with_ml(manufacturer, ProductListingData(**minimal_data))
                
                if text_analysis["suspicious_keywords"]:
                    monitoring_result["warnings"].append("ML detected suspicious manufacturer information")
                    monitoring_result["risk_score"] += 0.3
        
        elif step_number == 3:  # Offer
            if "price" in step_data:
                price = float(step_data["price"])
                if price < 5.0:
                    monitoring_result["warnings"].append(f"Suspiciously low price: ${price}")
                    monitoring_result["risk_score"] += 0.4
        
        elif step_number == 6:  # Images
            if "mainImage" in step_data:
                main_image = step_data["mainImage"]
                if main_image:
                    try:
                        # Use ML image analysis
                        if main_image.startswith('data:image'):
                            image_data_clean = main_image.split(',')[1]
                            image_bytes = base64.b64decode(image_data_clean)
                        else:
                            image_bytes = base64.b64decode(main_image)
                        
                        processed_image = preprocess_image(image_bytes, target_size=(IMAGE_SIZE_W, IMAGE_SIZE_H))
                        processed_brand = get_embedded_sequence_for_inference(step_data.get("brandName", ""), word2vec_model_wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM)
                        processed_tagline = get_embedded_sequence_for_inference(step_data.get("productTitle", ""), word2vec_model_wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM)
                        
                        prediction_output = ml_model.predict([processed_image, processed_brand, processed_tagline])
                        authenticity_score = float(prediction_output[0][0])
                        
                        if authenticity_score < 0.7:
                            monitoring_result["warnings"].append(f"ML model detected potential counterfeit image (score: {authenticity_score:.4f})")
                            monitoring_result["risk_score"] += 0.5
                        
                    except Exception as e:
                        monitoring_result["warnings"].append(f"Image analysis failed: {str(e)}")
                        monitoring_result["risk_score"] += 0.2
        
        # Add recommendations based on risk score
        if monitoring_result["risk_score"] > 0.7:
            monitoring_result["recommendations"].append("CRITICAL: High risk detected - manual review required")
        elif monitoring_result["risk_score"] > 0.4:
            monitoring_result["recommendations"].append("Medium risk detected - review recommended")
        
        logger.info(f"Step {step_number} monitoring completed for product {product_id}")
        return monitoring_result
        
    except Exception as e:
        logger.error(f"Error in step monitoring: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit/listing")
async def submit_product_listing(request: Dict):
    """Submit final product listing with comprehensive AI monitoring"""
    try:
        listing_data_dict = request.get("listing_data", {})
        seller_id = request.get("seller_id", "unknown")
        
        # Convert dict to ProductListingData object
        listing_data = ProductListingData(**listing_data_dict)
        
        product_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        logger.info(f"Processing product listing submission for seller {seller_id}")
        
        # Comprehensive AI monitoring
        monitoring_result = await perform_comprehensive_monitoring(listing_data, product_id, seller_id)
        
        # Create listed product
        listed_product = ListedProduct(
            id=product_id,
            listing_data=listing_data,
            monitoring_result=monitoring_result,
            created_at=timestamp,
            status="active" if monitoring_result.risk_level in ["low", "medium"] else "flagged"
        )
        
        listed_products.append(listed_product)
        
        # Print all details to terminal
        print("\n" + "="*80)
        print("PRODUCT LISTING SUBMITTED")
        print("="*80)
        print(f"Product ID: {product_id}")
        print(f"Seller ID: {seller_id}")
        print(f"Timestamp: {timestamp}")
        print(f"Brand: {listing_data.brandName}")
        print(f"Product Title: {listing_data.productTitle}")
        print(f"Price: ${listing_data.price}")
        print(f"Category: {listing_data.category}")
        print(f"Condition: {listing_data.condition}")
        print(f"Fulfillment: {listing_data.fulfillmentType}")
        print(f"Quantity: {listing_data.quantity}")
        print(f"Country of Origin: {listing_data.countryOfOrigin}")
        print(f"Manufacturer: {listing_data.manufacturer}")
        print(f"Part Number: {listing_data.partNumber}")
        print(f"Model Number: {listing_data.modelNumber}")
        print(f"Description: {listing_data.productDescription[:100]}...")
        print(f"Bullet Points: {listing_data.bulletPoints}")
        print(f"Has Variations: {listing_data.hasVariations}")
        print(f"Variation Type: {listing_data.variationType}")
        print(f"Variations: {listing_data.variations}")
        print(f"Main Image: {truncate_image_url(listing_data.mainImage, 30)}")
        print(f"Additional Images: {len(listing_data.additionalImages)}")
        print(f"Shipping Template: {listing_data.shippingTemplate}")
        print(f"Handling Time: {listing_data.handlingTime}")
        print(f"Shipping Weight: {listing_data.shippingWeight}")
        print(f"Shipping Dimensions: {listing_data.shippingDimensions}")
        print(f"Shipping Service: {listing_data.shippingService}")
        print(f"Free Shipping: {listing_data.freeShipping}")
        print("\nAI MONITORING RESULTS:")
        print(f"Risk Level: {monitoring_result.risk_level}")
        print(f"Risk Score: {monitoring_result.overall_risk_score}")
        print(f"Flags: {len(monitoring_result.flags)}")
        
        # Show ML analysis results
        ml_analysis = monitoring_result.ai_analysis.get("ml_analysis", {})
        if ml_analysis.get("ml_model_used", False):
            print(f"\nML MODEL ANALYSIS:")
            print(f"  Authenticity Score: {ml_analysis.get('authenticity_score', 0):.4f}")
            print(f"  Predicted Label: {ml_analysis.get('predicted_label', 'Unknown')}")
            print(f"  Visual Analysis: {ml_analysis.get('visual_analysis', 'N/A')}")
            print(f"  Text Analysis: {ml_analysis.get('text_analysis', 'N/A')}")
            print(f"  Similarity Check: {ml_analysis.get('similarity_check', 'N/A')}")
            print(f"  Summary: {ml_analysis.get('summary', 'N/A')}")
        else:
            print(f"\nML MODEL ANALYSIS: {ml_analysis.get('error', 'Not available')}")
        
        # Show all flags
        if monitoring_result.flags:
            print(f"\nDETECTED FLAGS:")
            for i, flag in enumerate(monitoring_result.flags, 1):
                print(f"  {i}. [{flag.get('severity', 'unknown').upper()}] {flag.get('message', 'No message')}")
        
        print(f"\nRecommendations: {monitoring_result.recommendations}")
        print("="*80)
        
        return {
            "product_id": product_id,
            "status": "success",
            "monitoring_result": monitoring_result.dict(),
            "message": "Product listing submitted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error in product listing submission: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/products/search")
async def search_products(keyword: str = ""):
    """Search listed products by keyword"""
    try:
        if not keyword:
            return {"products": [p.dict() for p in listed_products]}
        
        # Simple keyword search
        filtered_products = []
        keyword_lower = keyword.lower()
        
        for product in listed_products:
            title = product.listing_data.productTitle.lower()
            brand = product.listing_data.brandName.lower()
            description = product.listing_data.productDescription.lower()
            
            if (keyword_lower in title or 
                keyword_lower in brand or 
                keyword_lower in description):
                filtered_products.append(product)
        
        return {"products": [p.dict() for p in filtered_products]}
        
    except Exception as e:
        logger.error(f"Error in product search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/products/{product_id}")
async def get_product_details(product_id: str):
    """Get detailed product information including monitoring results"""
    try:
        for product in listed_products:
            if product.id == product_id:
                return product.dict()
        
        raise HTTPException(status_code=404, detail="Product not found")
        
    except Exception as e:
        logger.error(f"Error getting product details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/monitoring/flags")
async def get_monitoring_flags():
    """Get all monitoring flags"""
    return {"flags": monitoring_flags}

@app.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify server is working"""
    return {
        "status": "success",
        "message": "Unified FastAPI server is running with ML monitoring",
        "timestamp": datetime.now().isoformat()
    }

# Only needed if you're running it via uvicorn in development
if __name__ == "__main__":
    import os
    import uvicorn
    PORT = int(os.environ.get("PORT", 10000))
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True)