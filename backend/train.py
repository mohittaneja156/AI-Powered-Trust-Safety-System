# train_model.py

import os
import cv2
import pandas as pd
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Flatten, concatenate, LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping
from gensim.models import Word2Vec
from sklearn import preprocessing
import pickle # For saving label_encoder
import json

# --- Configuration ---
# IMPORTANT: Adjust these paths to your local setup
CSV_PATH = '/home/gauri/Downloads/archive (1)/file_mapping.csv'
DATA_ROOT_DIR = '/home/gauri/Downloads/archive (1)' # Base directory where 'genLogoOutput' resides
MODEL_SAVE_DIR = './saved_model' # Directory to save trained models and assets
KERAS_MODEL_FILENAME = 'my_logo_authenticity_model.h5'
WORD2VEC_MODEL_FILENAME = 'word2vec_model.bin'
LABEL_ENCODER_FILENAME = 'label_encoder.pkl'
CONFIG_FILENAME = 'model_config.json' # To save parameters like MAX_SEQUENCE_LEN
REFERENCE_FEATURES_FILENAME = 'brand_image_features.pkl' # For storing genuine brand image features

# Derived full paths
MODEL_SAVE_PATH = os.path.join(MODEL_SAVE_DIR, KERAS_MODEL_FILENAME)
WORD2VEC_MODEL_PATH = os.path.join(MODEL_SAVE_DIR, WORD2VEC_MODEL_FILENAME)
LABEL_ENCODER_PATH = os.path.join(MODEL_SAVE_DIR, LABEL_ENCODER_FILENAME)
CONFIG_SAVE_PATH = os.path.join(MODEL_SAVE_DIR, CONFIG_FILENAME)
REFERENCE_FEATURES_PATH = os.path.join(MODEL_SAVE_DIR, REFERENCE_FEATURES_FILENAME)


# Model input parameters (MUST be consistent for training and inference)
IMAGE_SIZE_W, IMAGE_SIZE_H = 90, 90 # (width, height)
IMAGE_CHANNELS = 3
EMBEDDING_DIM = 100 # From Word2Vec
MAX_SEQUENCE_LEN = 0 # Will be determined from data and saved


# --- Data Loading and Initial Cleaning ---
print("Loading data...")
df = pd.read_csv(CSV_PATH)

# Remove 'scal_' entries as per your notebook
initial_df_rows = len(df)
df = df[~df['Filename'].str.contains('scal_')]
df.reset_index(drop=True, inplace=True)
print(f"Removed {initial_df_rows - len(df)} rows containing 'scal_'.")

# Apply label encoding
label_encoder = preprocessing.LabelEncoder()
df['Label'] = label_encoder.fit_transform(df['Label'])
print(f"Label encoder classes: {label_encoder.classes_}")

# IMPORTANT: Adjust this section to use 'Genuine' and 'Fake' based on your CSV
# Check if 'Genuine' and 'Fake' are in the classes
if 'Genuine' not in label_encoder.classes_ or 'Fake' not in label_encoder.classes_:
    raise ValueError("LabelEncoder must contain 'Genuine' and 'Fake' classes as per your CSV.")

REAL_LABEL_ENCODED = label_encoder.transform(['Genuine'])[0]
FAKE_LABEL_ENCODED = label_encoder.transform(['Fake'])[0]
print(f"'Genuine' is encoded as: {REAL_LABEL_ENCODED}")
print(f"'Fake' is encoded as: {FAKE_LABEL_ENCODED}")


# Shuffle the DataFrame (important before splitting)
df = df.sample(frac=1, random_state=42) # Use random_state for reproducibility
df.reset_index(drop=True, inplace=True)

brand_names = df['Brand Name'].astype(str).tolist()
taglines = df['Tagline'].astype(str).tolist()
labels = df['Label'].tolist()


# --- Word2Vec Training ---
print("Training Word2Vec model...")
texts_for_w2v = brand_names + taglines
tokenized_texts = [text.lower().split() for text in texts_for_w2v] # Convert to lowercase here
# Ensure all brand names and taglines are lowercased for W2V training consistency
df['Brand Name'] = df['Brand Name'].astype(str).str.lower()
df['Tagline'] = df['Tagline'].astype(str).str.lower()
brand_names_lower = df['Brand Name'].tolist()
taglines_lower = df['Tagline'].tolist()


word2vec_model = Word2Vec(sentences=tokenized_texts, vector_size=EMBEDDING_DIM, min_count=1, workers=4)
print(f"Word2Vec model trained. Vocabulary size: {len(word2vec_model.wv.key_to_index)}")

# Determine the maximum sequence length for padding
# Use lowercased versions for length calculation
all_lengths = [len(text.split()) for text in brand_names_lower + taglines_lower]
MAX_SEQUENCE_LEN = max(all_lengths) if all_lengths else 1 # Ensure at least 1 for empty lists
print(f"Determined MAX_SEQUENCE_LEN: {MAX_SEQUENCE_LEN}")

# Function to get embedded sequence for a given text
def get_embedded_sequence(text, w2v_model_wv, max_len, embedding_dim):
    words = text.split()
    sequence = np.zeros((max_len, embedding_dim), dtype=np.float32)
    for i, word in enumerate(words[:max_len]): # Truncate if longer than max_len
        if word in w2v_model_wv.key_to_index:
            sequence[i] = w2v_model_wv[word]
    return sequence

# Convert brand and tagline texts to embedded sequences (using lowercased versions)
brand_embedded_sequences_list = [get_embedded_sequence(b, word2vec_model.wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM) for b in brand_names_lower]
tagline_embedded_sequences_list = [get_embedded_sequence(t, word2vec_model.wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM) for t in taglines_lower]

brand_padded_sequences = np.array(brand_embedded_sequences_list)
tagline_padded_sequences = np.array(tagline_embedded_sequences_list)

print(f"Shape of brand_padded_sequences: {brand_padded_sequences.shape}")
print(f"Shape of tagline_padded_sequences: {tagline_padded_sequences.shape}")


# --- Image Augmentation (for FAKE Logos) ---
print(f"Applying artificial elements to 'Fake' logos (Label {FAKE_LABEL_ENCODED}) in-place...")

def add_artificial_elements(image_np_array):
    """
    Adds random shapes and textures to an image.
    Expects and returns an RGB image (NumPy array).
    """
    height, width, _ = image_np_array.shape
    augmented_image = image_np_array.copy()

    # Add random shapes
    num_shapes = np.random.randint(1, 5)
    for _ in range(num_shapes):
        shape_type = np.random.choice(['rectangle', 'circle', 'line'])
        color_rgb = np.random.randint(0, 256, 3).tolist() # RGB color
        color_bgr = color_rgb[::-1] # Convert to BGR for OpenCV drawing

        if shape_type == 'rectangle':
            x1, y1 = np.random.randint(0, width, 2)
            x2, y2 = np.random.randint(0, width, 2)
            pt1 = (min(x1, x2), min(y1, y2))
            pt2 = (max(x1, x2), max(y1, y2))
            cv2.rectangle(augmented_image, pt1, pt2, color_bgr, -1)
        elif shape_type == 'circle':
            center_x, center_y = np.random.randint(0, width, 2)
            center_x = min(center_x, width - 1)
            center_y = min(center_y, height - 1)
            radius = np.random.randint(10, min(width, height) // 4)
            cv2.circle(augmented_image, (center_x, center_y), radius, color_bgr, -1)
        elif shape_type == 'line':
            x1, y1 = np.random.randint(0, width, 2)
            x2, y2 = np.random.randint(0, width, 2)
            pt1 = (x1, y1)
            pt2 = (x2, y2)
            cv2.line(augmented_image, pt1, pt2, color_bgr, 5)

    # Add random textures
    num_textures = np.random.randint(1, 3)
    for _ in range(num_textures):
        texture = np.random.randint(0, 256, (height, width, IMAGE_CHANNELS), dtype=np.uint8) # RGB texture
        alpha = np.random.uniform(0.2, 0.5)

        # Blend: augmented_image (RGB) with texture (RGB)
        # OpenCV's addWeighted expects BGR, so convert, blend, convert back.
        augmented_image_bgr = cv2.cvtColor(augmented_image, cv2.COLOR_RGB2BGR)
        texture_bgr = cv2.cvtColor(texture, cv2.COLOR_RGB2BGR)
        blended_bgr = cv2.addWeighted(augmented_image_bgr, alpha, texture_bgr, 1 - alpha, 0)
        augmented_image = cv2.cvtColor(blended_bgr, cv2.COLOR_BGR2RGB) # Convert back to RGB

    return augmented_image


# Get paths of 'FAKE' logos (Label FAKE_LABEL_ENCODED) for augmentation
img_paths_to_augment = []
for i, row in df[df.Label == FAKE_LABEL_ENCODED].iterrows():
    relative_path = row['Filename'].replace('\\', '/')
    full_path = os.path.join(DATA_ROOT_DIR, relative_path)
    img_paths_to_augment.append(full_path)

print(f"Found {len(img_paths_to_augment)} images to augment (as FAKE) and overwrite.")

for image_path in img_paths_to_augment:
    try:
        image_bgr = cv2.imread(image_path)
        if image_bgr is None:
            print(f"Warning: Skipping {image_path} - could not load image.")
            continue

        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB) # Read as BGR, convert to RGB
        augmented_image_rgb = add_artificial_elements(image_rgb)
        augmented_image_bgr_to_save = cv2.cvtColor(augmented_image_rgb, cv2.COLOR_RGB2BGR) # Convert back to BGR for saving
        cv2.imwrite(image_path, augmented_image_bgr_to_save)
    except Exception as e:
        print(f"Error augmenting and saving {image_path}: {e}")
print("Image augmentation process complete for FAKE logos.")


# --- Load all images for model input ---
print("Loading and preprocessing all images for model training...")
images = []
image_filenames_successful = [] # Keep track of successfully loaded images
for index, row in df.iterrows():
    image_filename = row['Filename']
    full_image_path = os.path.join(DATA_ROOT_DIR, image_filename.replace('\\', '/'))
    try:
        # Load and resize using PIL (load_img) which expects (height, width) for target_size
        image = load_img(full_image_path, target_size=(IMAGE_SIZE_H, IMAGE_SIZE_W))
        image = img_to_array(image) # Convert to numpy array
        images.append(image)
        image_filenames_successful.append(image_filename)
    except FileNotFoundError:
        print(f"Error: Image file not found at {full_image_path}. Skipping this entry.")
    except Exception as e:
        print(f"Error loading image {full_image_path}: {e}. Skipping this entry.")

images = np.array(images)
images = images / 255.0 # Normalize pixel values to [0, 1]
print(f"Shape of all loaded and preprocessed images: {images.shape}")

# Filter corresponding text data and labels based on successfully loaded images
# This is crucial if some image files were missing/corrupted
filtered_df = df[df['Filename'].isin(image_filenames_successful)].reset_index(drop=True)
labels_filtered = filtered_df['Label'].tolist()
# IMPORTANT: Use the lowercased brand names for filtering and feature extraction
filtered_brand_names_lower = filtered_df['Brand Name'].tolist() # Get lowercased brand names

# Re-generate padded sequences with filtered_df to ensure alignment
brand_embedded_sequences_list_filtered = [get_embedded_sequence(b, word2vec_model.wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM) for b in filtered_brand_names_lower]
tagline_embedded_sequences_list_filtered = [get_embedded_sequence(t, word2vec_model.wv, MAX_SEQUENCE_LEN, EMBEDDING_DIM) for t in filtered_df['Tagline'].tolist()]

brand_padded_sequences_filtered = np.array(brand_embedded_sequences_list_filtered)
tagline_padded_sequences_filtered = np.array(tagline_embedded_sequences_list_filtered)


# --- Data Splitting ---
print("Splitting data into train and test sets...")
split_ratio = 0.8
split_size = int(len(images) * split_ratio)

train_images = images[:split_size]
train_labels = np.array(labels_filtered[:split_size])
test_images = images[split_size:]
test_labels = np.array(labels_filtered[split_size:])

train_brand = brand_padded_sequences_filtered[:split_size]
test_brand = brand_padded_sequences_filtered[split_size:]
train_tagline = tagline_padded_sequences_filtered[:split_size]
test_tagline = tagline_padded_sequences_filtered[split_size:]

print(f"Train images shape: {train_images.shape}")
print(f"Test images shape: {test_images.shape}")
print(f"Train brand shape: {train_brand.shape}")
print(f"Test brand shape: {test_brand.shape}")


# --- Model Definition ---
print("Defining and compiling model...")
# Using MobileNet for image features
from tensorflow.keras.applications import MobileNet

image_input = Input(shape=(IMAGE_SIZE_H, IMAGE_SIZE_W, IMAGE_CHANNELS), name='image_input')

base_model = MobileNet(include_top=False, weights='imagenet', input_tensor=image_input)

# Freeze MobileNet layers to prevent them from being updated during training
for layer in base_model.layers:
    layer.trainable = False

image_features = base_model.output # This is the output tensor of MobileNet
image_features = Flatten(name='image_flatten_output')(image_features) # Added a name for clarity

# Brand features branch
brand_input = Input(shape=(MAX_SEQUENCE_LEN, EMBEDDING_DIM), name='brand_input')
brand_features = LSTM(64)(brand_input)

# Tagline features branch
tagline_input = Input(shape=(MAX_SEQUENCE_LEN, EMBEDDING_DIM), name='tagline_input')
tagline_features = LSTM(64)(tagline_input)

# Concatenate all features
merged_features = concatenate([image_features, brand_features, tagline_features])

# Dense layers for classification
x = Dense(128, activation='relu')(merged_features)
output = Dense(1, activation='sigmoid', name='authenticity_output')(x) # Sigmoid for binary classification

# Create the final model
model = Model(inputs=[image_input, brand_input, tagline_input], outputs=output)

model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.00001),
              loss='binary_crossentropy',
              metrics=['accuracy'])
model.summary()


# --- Model Training ---
print("Starting model training...")
m_loss = EarlyStopping(
    monitor="val_loss",
    min_delta=0,
    patience=5,
    verbose=1,
    mode="auto",
    baseline=None,
    restore_best_weights=True,
)

history = model.fit([train_images, train_brand, train_tagline],
                    train_labels,
                    batch_size=32,
                    epochs=15,
                    validation_data=([test_images, test_brand, test_tagline], test_labels),
                    callbacks=[m_loss])

# --- Evaluation ---
print("\nEvaluating model on test set...")
loss, accuracy = model.evaluate([test_images, test_brand, test_tagline], test_labels)
print(f'Test Loss: {loss:.4f}')
print(f'Test Accuracy: {accuracy:.4f}')


# --- Extract and Save Reference Brand Image Features ---
print("\nExtracting and saving reference brand image features...")

# Ensure the directory exists BEFORE saving any files into it
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)

# 1. Create a sub-model to get the image features
# Use the directly defined Input tensor for the image input branch
image_feature_extractor = Model(inputs=image_input,
                                outputs=model.get_layer('image_flatten_output').output)
print("Image feature extractor model created.")

# 2. Filter DataFrame for genuine (REAL) logos only
genuine_df = filtered_df[filtered_df['Label'] == REAL_LABEL_ENCODED].reset_index(drop=True)
print(f"Found {len(genuine_df)} genuine logo entries to extract features from.")

# Dictionary to store mean features for each brand
brand_image_features = {}

for index, row in genuine_df.iterrows():
    brand = row['Brand Name'] # This is already lowercased from earlier processing
    image_filename = row['Filename']
    full_image_path = os.path.join(DATA_ROOT_DIR, image_filename.replace('\\', '/'))

    try:
        image = load_img(full_image_path, target_size=(IMAGE_SIZE_H, IMAGE_SIZE_W))
        image = img_to_array(image)
        image = np.expand_dims(image, axis=0) / 255.0 # Add batch dim and normalize

        # Predict features using the extractor sub-model
        features = image_feature_extractor.predict(image, verbose=0)[0] # Get features for single image

        if brand not in brand_image_features:
            brand_image_features[brand] = []
        brand_image_features[brand].append(features)

    except FileNotFoundError:
        print(f"Warning: Reference image not found at {full_image_path} for brand '{brand}'. Skipping.")
    except Exception as e:
        print(f"Error processing reference image {full_image_path} for brand '{brand}': {e}. Skipping.")

# Convert list of features to a single numpy array (mean) for each brand
averaged_brand_image_features = {
    brand: np.mean(np.array(features_list), axis=0)
    for brand, features_list in brand_image_features.items()
}
print(f"Extracted mean features for {len(averaged_brand_image_features)} unique genuine brands.")

# Save the averaged reference features
with open(REFERENCE_FEATURES_PATH, 'wb') as f:
    pickle.dump(averaged_brand_image_features, f)
print(f"Reference brand image features saved to: {REFERENCE_FEATURES_PATH}")


# --- Save Model and Assets (main model, Word2Vec, LabelEncoder, Config) ---
print("\nSaving main model and assets...")
# Directory creation is already handled above, but keeping this line doesn't hurt.
# os.makedirs(MODEL_SAVE_DIR, exist_ok=True) 

model.save(MODEL_SAVE_PATH)
print(f"Keras Model saved to: {MODEL_SAVE_PATH}")

word2vec_model.save(WORD2VEC_MODEL_PATH)
print(f"Word2Vec model saved to: {WORD2VEC_MODEL_PATH}")

with open(LABEL_ENCODER_PATH, 'wb') as f:
    pickle.dump(label_encoder, f)
print(f"LabelEncoder saved to: {LABEL_ENCODER_PATH}")

# Save configuration parameters needed for inference
# Save configuration parameters needed for inference
config = {
    'IMAGE_SIZE_W': IMAGE_SIZE_W,
    'IMAGE_SIZE_H': IMAGE_SIZE_H,
    'IMAGE_CHANNELS': IMAGE_CHANNELS,
    'MAX_SEQUENCE_LEN': MAX_SEQUENCE_LEN,
    'EMBEDDING_DIM': EMBEDDING_DIM,
    'REAL_LABEL_ENCODED': int(REAL_LABEL_ENCODED), # Convert to standard Python int
    'FAKE_LABEL_ENCODED': int(FAKE_LABEL_ENCODED),   # Convert to standard Python int
}
with open(CONFIG_SAVE_PATH, 'w') as f:
    json.dump(config, f, indent=4)
print(f"Configuration saved to: {CONFIG_SAVE_PATH}")

print("\nTraining and asset saving complete. You can now run `inference_api.py`.")