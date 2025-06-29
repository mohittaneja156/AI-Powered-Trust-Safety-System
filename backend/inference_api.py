# inference_api.py

import os
import io
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from gensim.models import Word2Vec
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import pickle # For loading label_encoder
from scipy.spatial.distance import cosine # For similarity calculation
import uuid
from datetime import datetime

# --- Configuration (MUST match training script's saved values) ---
MODEL_SAVE_DIR = './saved_model' # Directory where trained models and assets are saved
KERAS_MODEL_FILENAME = 'my_logo_authenticity_model.h5'
WORD2VEC_MODEL_FILENAME = 'word2vec_model.bin'
LABEL_ENCODER_FILENAME = 'label_encoder.pkl'
CONFIG_FILENAME = 'model_config.json'
REFERENCE_FEATURES_FILENAME = 'brand_image_features.pkl' # NEW: For loading genuine brand image features

MODEL_LOAD_PATH = os.path.join(MODEL_SAVE_DIR, KERAS_MODEL_FILENAME)
WORD2VEC_MODEL_PATH = os.path.join(MODEL_SAVE_DIR, WORD2VEC_MODEL_FILENAME)
LABEL_ENCODER_PATH = os.path.join(MODEL_SAVE_DIR, LABEL_ENCODER_FILENAME)
CONFIG_LOAD_PATH = os.path.join(MODEL_SAVE_DIR, CONFIG_FILENAME)
REFERENCE_FEATURES_PATH = os.path.join(MODEL_SAVE_DIR, REFERENCE_FEATURES_FILENAME) # NEW PATH


# --- FastAPI App Setup ---
app = FastAPI(
    title="Product Authenticity ML API",
    description="API for logo and text authenticity prediction using a trained ML model.",
    version="1.0.0",
)

# --- CORS Configuration ---
origins = [
    "http://localhost:3000", # Your Next.js development server
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global Variables for Model and Assets ---
ml_model = None
image_feature_extractor_model = None # NEW: Sub-model for just image features
word2vec_model_wv = None
label_encoder = None
IMAGE_SIZE_W, IMAGE_SIZE_H = None, None
MAX_SEQUENCE_LEN = None
EMBEDDING_DIM = None
REAL_LABEL_ENCODED = None # NEW: Store these for clarity
FAKE_LABEL_ENCODED = None # NEW: Store these for clarity
BRAND_REFERENCE_FEATURES = None # NEW: Store loaded reference features

# --- In-memory store for flags (for demonstration) ---
flags_store = []

def create_flag(flag_data):
    flag_id = str(uuid.uuid4())
    flag = {
        "id": flag_id,
        "title": flag_data.get("title", "Suspicious Activity Detected"),
        "severity": flag_data.get("severity", "High"),
        "status": "Open",
        "flaggedOn": datetime.now().strftime("%Y-%m-%d"),
        "risk": flag_data.get("risk", "Counterfeit"),
        "category": flag_data.get("category", "Product Listing"),
        "evidence": flag_data.get("evidence", []),
        "aiSummary": flag_data.get("aiSummary", ""),
        "user_upload": flag_data.get("user_upload", {}),
    }
    flags_store.append(flag)
    print(f"Flag created: {flag}")
    return flag

# --- Preprocessing Functions (Server side) ---

def preprocess_image(image_bytes: bytes, target_size: tuple):
    """
    Preprocesses image bytes for the TensorFlow model.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize(target_size)
        image_array = np.array(image).astype(np.float32)
        image_array = image_array / 255.0 # Normalize pixels (MUST match training)
        image_array = np.expand_dims(image_array, axis=0) # Add batch dimension (1, H, W, C)
        return image_array
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image preprocessing failed: {e}")

def get_embedded_sequence_for_inference(text: str, w2v_wv, max_len: int, embedding_dim: int):
    """
    Converts a single text string into a padded Word2Vec embedded sequence for inference.
    """
    words = text.lower().split() # Convert text to lowercase for consistency
    sequence = np.zeros((max_len, embedding_dim), dtype=np.float32)
    for i, word in enumerate(words[:max_len]): # Truncate if longer than max_len
        if word in w2v_wv.key_to_index:
            sequence[i] = w2v_wv[word]
    return np.expand_dims(sequence, axis=0) # Add batch dimension (1, MAX_SEQUENCE_LEN, EMBEDDING_DIM)

# --- Model Loading and Initialization ---
@app.on_event("startup")
async def load_ml_assets():
    """
    Load the Keras model, Word2Vec model, LabelEncoder, and config when the app starts.
    """
    global ml_model, image_feature_extractor_model, word2vec_model_wv, label_encoder
    global IMAGE_SIZE_W, IMAGE_SIZE_H, MAX_SEQUENCE_LEN, EMBEDDING_DIM
    global REAL_LABEL_ENCODED, FAKE_LABEL_ENCODED, BRAND_REFERENCE_FEATURES

    print("Loading ML model and assets...")
    try:
        # Load configuration
        with open(CONFIG_LOAD_PATH, 'r') as f:
            config = json.load(f)
            IMAGE_SIZE_W = config['IMAGE_SIZE_W']
            IMAGE_SIZE_H = config['IMAGE_SIZE_H']
            MAX_SEQUENCE_LEN = config['MAX_SEQUENCE_LEN']
            EMBEDDING_DIM = config['EMBEDDING_DIM']
            # Ensure these are loaded correctly from the config saved by train_model.py
            REAL_LABEL_ENCODED = config.get('REAL_LABEL_ENCODED', None)
            FAKE_LABEL_ENCODED = config.get('FAKE_LABEL_ENCODED', None)
            
            if REAL_LABEL_ENCODED is None or FAKE_LABEL_ENCODED is None:
                 raise ValueError("REAL_LABEL_ENCODED or FAKE_LABEL_ENCODED not found in config. Please re-run train_model.py to generate updated config.")

        print(f"Configuration loaded: {config}")

        # Load the Keras model
        ml_model = load_model(MODEL_LOAD_PATH)
        print(f"Keras model loaded successfully from {MODEL_LOAD_PATH}")
        
        # NEW: Create a sub-model to extract image features for similarity check
        image_feature_extractor_model = Model(inputs=ml_model.input[0], # Assuming image_input is the first input
                                      outputs=ml_model.get_layer('image_flatten_output').output)

        print("Image feature extractor sub-model created.")

        # Load Word2Vec model (only need the word vectors part for inference)
        full_word22vec_model = Word2Vec.load(WORD2VEC_MODEL_PATH)
        word2vec_model_wv = full_word22vec_model.wv
        print(f"Word2Vec word vectors loaded successfully from {WORD2VEC_MODEL_PATH}")

        # Load LabelEncoder
        with open(LABEL_ENCODER_PATH, 'rb') as f:
            label_encoder = pickle.load(f)
        print(f"LabelEncoder loaded successfully from {LABEL_ENCODER_PATH}. Classes: {label_encoder.classes_}")
        
        # Verify label encoder consistency with config
        if label_encoder.transform(['Genuine'])[0] != REAL_LABEL_ENCODED or \
           label_encoder.transform(['Fake'])[0] != FAKE_LABEL_ENCODED:
            print("WARNING: LabelEncoder mapping ('Genuine', 'Fake') does not match values saved in config.")
            print("Using config values for REAL_LABEL_ENCODED and FAKE_LABEL_ENCODED.")


        # NEW: Load reference brand image features
        with open(REFERENCE_FEATURES_PATH, 'rb') as f:
            BRAND_REFERENCE_FEATURES = pickle.load(f)
        print(f"Reference brand image features loaded successfully from {REFERENCE_FEATURES_PATH}. Brands: {list(BRAND_REFERENCE_FEATURES.keys())}")

        print("ML assets loaded and ready.")

    except Exception as e:
        print(f"ERROR: Failed to load ML assets: {e}")
        raise RuntimeError(f"Failed to load ML assets: {e}. Check paths and file integrity.")

# --- API Endpoint Definition ---
class PredictionOutput(BaseModel):
    visual_analysis_status: str
    visual_analysis_message: str
    text_analysis_status: str
    text_analysis_message: str
    summary: str
    authenticity_score: float
    predicted_label_text: str
    similarity_check_status: str # NEW: Status of the brand image similarity check
    similarity_check_message: str # NEW: Message for the brand image similarity check

@app.post("/predict_authenticity/", response_model=PredictionOutput)
async def predict_authenticity(
    image: UploadFile = File(...),
    brand_name: str = Form(...),
    tagline: str = Form(...)
):
    # Check if models are loaded before processing requests
    if ml_model is None or word2vec_model_wv is None or label_encoder is None or image_feature_extractor_model is None or BRAND_REFERENCE_FEATURES is None:
        raise HTTPException(status_code=503, detail="ML model and assets not loaded. Server is not ready.")
    
    if MAX_SEQUENCE_LEN is None or EMBEDDING_DIM is None or REAL_LABEL_ENCODED is None or FAKE_LABEL_ENCODED is None:
        raise HTTPException(status_code=500, detail="Model configuration (including label encodings) not loaded correctly.")

    print(f"Received request: Image filename='{image.filename}', Brand='{brand_name}', Tagline='{tagline}'")

    # Initialize similarity check results
    similarity_status = 'clear'
    similarity_message = 'Image similarity check not performed (brand not in reference) or passed.'

    # 1. Image Preprocessing
    image_bytes = await image.read()
    processed_image = preprocess_image(image_bytes, target_size=(IMAGE_SIZE_W, IMAGE_SIZE_H))
    print("Image preprocessed successfully.")

    # NEW: Perform brand image similarity check first if reference data exists for the brand
    input_brand_name_lower = brand_name.lower()
    if input_brand_name_lower in BRAND_REFERENCE_FEATURES:
        print(f"Performing similarity check for brand: {input_brand_name_lower}")
        uploaded_image_features = image_feature_extractor_model.predict(processed_image, verbose=0)[0]
        
        reference_features = BRAND_REFERENCE_FEATURES[input_brand_name_lower]
        
        # Calculate cosine similarity (higher is more similar, range -1 to 1)
        # Using 1 - cosine distance for actual similarity
        similarity = 1 - cosine(uploaded_image_features, reference_features)
        
        # Define a strict similarity threshold
        SIMILARITY_THRESHOLD = 0.85 # Adjust this value based on experimentation
        print(f"Image similarity to known '{input_brand_name_lower}' logos: {similarity:.4f} (Threshold: {SIMILARITY_THRESHOLD})")

        if similarity < SIMILARITY_THRESHOLD:
            similarity_status = 'warning'
            similarity_message = f"Uploaded image is significantly different (similarity: {similarity:.4f}) from known genuine logos for '{brand_name}'. This strongly indicates a fake."
            # If similarity is low, we can immediately flag it as fake regardless of main model
            predicted_label_text = label_encoder.inverse_transform([FAKE_LABEL_ENCODED])[0]
            authenticity_score = 0.05 # Assign a very low score to reflect immediate fake detection
            
            visual_status = 'warning'
            visual_message = similarity_message
            text_status = 'clear' # Text might be fine, but image is decisive
            text_message = 'Text attributes will not override visual discrepancy, as image is critical.'
            summary = 'AI concludes product is **FAKE** due to strong visual dissimilarity to known brand images.'

            response_output = PredictionOutput(
                visual_analysis_status=visual_status,
                visual_analysis_message=visual_message,
                text_analysis_status=text_status,
                text_analysis_message=text_message,
                summary=summary,
                authenticity_score=authenticity_score,
                predicted_label_text=predicted_label_text,
                similarity_check_status=similarity_status,
                similarity_check_message=similarity_message
            )
            print(f"Sending response (due to low similarity): {response_output.model_dump_json(indent=2)}")
            return response_output
        else:
            similarity_status = 'clear'
            similarity_message = f"Uploaded image shows high visual similarity (score: {similarity:.4f}) to known genuine logos for '{brand_name}'."
    else:
        similarity_status = 'not_applicable'
        similarity_message = f"No reference image data available for brand '{brand_name}'. Skipping direct visual similarity check."
        print(f"No reference image data for brand: {input_brand_name_lower}. Skipping direct visual similarity check.")


    # If similarity check passed or not applicable, proceed with the main model prediction
    # 2. Text Preprocessing
    processed_brand = get_embedded_sequence_for_inference(brand_name, word2vec_model_wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM)
    processed_tagline = get_embedded_sequence_for_inference(tagline, word2vec_model_wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM)
    print("Text (brand and tagline) preprocessed successfully.")

    # 3. Main Model Prediction
    try:
        prediction_output = ml_model.predict([processed_image, processed_brand, processed_tagline])
        authenticity_score = float(prediction_output[0][0])
        print(f"Main model raw prediction output: {prediction_output}")
        print(f"Main model Authenticity Score: {authenticity_score:.4f}")

    except Exception as e:
        print(f"ERROR: Main model prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Main model prediction failed: {e}")

    # 4. Interpret Results based on main model (if similarity check didn't already flag as fake)
    AUTHENTICITY_THRESHOLD_REAL = 0.9 # Very strict threshold
    
    # Use REAL_LABEL_ENCODED and FAKE_LABEL_ENCODED from config
    predicted_label_idx = REAL_LABEL_ENCODED if authenticity_score >= AUTHENTICITY_THRESHOLD_REAL else FAKE_LABEL_ENCODED
    predicted_label_text = label_encoder.inverse_transform([predicted_label_idx])[0]
    
    print(f"Main Model Predicted Label: {predicted_label_text}")
    print(f"Authenticity Score: {authenticity_score}")

    # --- Flag creation logic for product listing ---
    if predicted_label_text.lower() in ["fake", "counterfeit"] or authenticity_score < 0.5:
        flag = create_flag({
            "title": "Counterfeit Product Listing Detected",
            "severity": "Critical",
            "risk": "Counterfeit",
            "category": "Product Listing",
            "evidence": [
                {"type": "Visual", "detail": f"Visual analysis failed with score {authenticity_score:.4f}", "image": None},
                {"type": "Text", "detail": f"Text analysis failed for brand '{brand_name}' and tagline '{tagline}'", "image": None},
            ],
            "aiSummary": f"AI flagged this product as counterfeit during listing. Authenticity score: {authenticity_score:.4f}",
            "user_upload": {
                "brand_name": brand_name,
                "tagline": tagline,
                "image_filename": image.filename,
                "authenticity_score": authenticity_score
            },
        })
        print(f"Flag created for product listing: {flag}")

    visual_status = 'clear'
    visual_message = 'No strong visual inconsistencies detected by AI model. Looks authentic.'
    text_status = 'clear'
    text_message = 'Text attributes appear consistent with known data. No misspellings or suspicious keywords found.'
    summary = 'AI assessment complete. Product appears authentic based on strict criteria.'

    if predicted_label_text == 'Fake': # Changed from 'FAKE' to 'Fake'
        visual_status = 'warning'
        visual_message = f"Likely visual discrepancy detected by primary model. Authenticity score: {authenticity_score:.4f}. This could indicate a fake logo or altered packaging."
        text_status = 'warning' 
        text_message = f"Text attributes (brand/tagline) also contribute to the 'Fake' assessment. Score: {authenticity_score:.4f}. Review for potential counterfeit keywords or misspellings."
        summary = 'AI identifies this product as potentially **FAKE** based on strict visual and text analysis. **URGENT MANUAL REVIEW RECOMMENDED.**'
    elif predicted_label_text == 'Genuine': # Changed from 'REAL' to 'Genuine'
        visual_status = 'clear'
        visual_message = f"Very high confidence in visual authenticity (Score: {authenticity_score:.4f}). Logo and packaging appear genuine."
        text_status = 'clear'
        text_message = f"Text attributes (brand name, tagline) are highly consistent with authentic products. Score: {authenticity_score:.4f}."
        summary = 'AI indicates very high probability of authenticity. Product can likely be listed without further review.'
    
    response_output = PredictionOutput(
        visual_analysis_status=visual_status,
        visual_analysis_message=visual_message,
        text_analysis_status=text_status,
        text_analysis_message=text_message,
        summary=summary,
        authenticity_score=authenticity_score,
        predicted_label_text=predicted_label_text,
        similarity_check_status=similarity_status, # Include new status
        similarity_check_message=similarity_message # Include new message
    )
    
    print(f"Sending response: {response_output.model_dump_json(indent=2)}")
    return response_output

if __name__ == "__main__":
    print("Starting FastAPI server...")
    uvicorn.run("inference_api:app", host="0.0.0.0", port=8000, reload=True)