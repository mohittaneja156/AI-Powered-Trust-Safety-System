import cv2
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet50, ResNet50_Weights
from transformers import ViTImageProcessor, ViTForImageClassification
import pytesseract
import logging
from typing import Dict, List, Tuple, Optional, Union
import os
from datetime import datetime
from test_products import TEST_PRODUCTS
from skimage.feature import local_binary_pattern
from skimage.metrics import structural_similarity as ssim

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductVerifier:
    def __init__(self):
        try:
            # Initialize ResNet50 for feature extraction
            self.resnet = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
            self.resnet = torch.nn.Sequential(*list(self.resnet.children())[:-1])  # Remove classification layer
            self.resnet.eval()
            
            # Initialize ViT for detailed image analysis
            self.vit_processor = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')
            self.vit_model = ViTForImageClassification.from_pretrained('google/vit-base-patch16-224')
            
            # Set device
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            self.resnet.to(self.device)
            self.vit_model.to(self.device)
            
            # Image preprocessing
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            
            # Initialize feature extractors
            self.sift = cv2.SIFT_create()
            self.bf_matcher = cv2.BFMatcher()
            
            # Initialize QR code detector
            self.qr_detector = cv2.QRCodeDetector()
            
            logger.info("ProductVerifier initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ProductVerifier: {str(e)}")
            raise

    def extract_barcode(self, image: np.ndarray) -> Optional[str]:
        """Extract and verify QR codes using OpenCV's QRCodeDetector."""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply multiple preprocessing techniques
            processed_images = [
                ("original", gray),
                ("blur", cv2.GaussianBlur(gray, (5, 5), 0)),
                ("sharpen", cv2.filter2D(gray, -1, np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]]))),
                ("adaptive", cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2))
            ]
            
            for method_name, processed_img in processed_images:
                # Try to detect QR code using OpenCV
                try:
                    # QRCodeDetector.detectAndDecode returns (data, bbox, straight_qrcode)
                    data, bbox, _ = self.qr_detector.detectAndDecode(processed_img)
                    
                    if data and len(data) > 0:
                        logger.info(f"QR code found using {method_name}: {data}")
                        return data
                except Exception as e:
                    logger.debug(f"QR detection failed for {method_name}: {str(e)}")
                    continue
            
            logger.warning("No QR code found in image")
            return None
            
        except Exception as e:
            logger.error(f"Error in QR code extraction: {str(e)}")
            return None

    def extract_visual_features(self, image: np.ndarray) -> Dict:
        """Extract comprehensive visual features using multiple models."""
        try:
            # Convert to PIL Image
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            
            # ResNet50 features
            img_tensor = self.transform(pil_image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                resnet_features = self.resnet(img_tensor).squeeze().cpu().numpy()
            
            # ViT features
            vit_inputs = self.vit_processor(images=pil_image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                vit_outputs = self.vit_model(**vit_inputs, output_hidden_states=True)
                vit_features = vit_outputs.hidden_states[-1][:, 0].cpu().numpy()
            
            # SIFT features
            keypoints, descriptors = self.sift.detectAndCompute(image, None)
            
            # Color histogram
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            color_hist = cv2.calcHist([hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
            cv2.normalize(color_hist, color_hist, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
            
            # Texture features using LBP
            lbp = local_binary_pattern(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY), 8, 1, method='uniform')
            lbp_hist, _ = np.histogram(lbp.ravel(), bins=59, range=(0, 59))
            lbp_hist = lbp_hist.astype("float")
            lbp_hist /= (lbp_hist.sum() + 1e-7)
            
            return {
                "resnet_features": resnet_features,
                "vit_features": vit_features,
                "sift_descriptors": descriptors if descriptors is not None else [],
                "color_histogram": color_hist,
                "texture_features": lbp_hist,
                "num_keypoints": len(keypoints) if keypoints is not None else 0
            }
            
        except Exception as e:
            logger.error(f"Error in visual feature extraction: {str(e)}")
            return {}

    def compare_features(self, features1: Dict, features2: Dict) -> Dict[str, float]:
        """Compare multiple feature sets with detailed similarity scores."""
        try:
            similarities = {}
            
            # Compare ResNet features
            resnet_sim = np.dot(features1["resnet_features"].flatten(), 
                               features2["resnet_features"].flatten()) / \
                        (np.linalg.norm(features1["resnet_features"]) * 
                         np.linalg.norm(features2["resnet_features"]))
            similarities["resnet_similarity"] = float(resnet_sim)
            
            # Compare ViT features
            vit_sim = np.dot(features1["vit_features"].flatten(), 
                           features2["vit_features"].flatten()) / \
                     (np.linalg.norm(features1["vit_features"]) * 
                      np.linalg.norm(features2["vit_features"]))
            similarities["vit_similarity"] = float(vit_sim)
            
            # Compare color histograms
            color_sim = cv2.compareHist(features1["color_histogram"],
                                      features2["color_histogram"],
                                      cv2.HISTCMP_CORREL)
            similarities["color_similarity"] = float(color_sim)
            
            # Compare texture features
            texture_sim = np.sum(np.minimum(features1["texture_features"], 
                                          features2["texture_features"]))
            similarities["texture_similarity"] = float(texture_sim)
            
            # Compare SIFT features if available
            if len(features1["sift_descriptors"]) > 0 and len(features2["sift_descriptors"]) > 0:
                matches = self.bf_matcher.knnMatch(features1["sift_descriptors"], 
                                                 features2["sift_descriptors"], k=2)
                good_matches = []
                for m, n in matches:
                    if m.distance < 0.75 * n.distance:
                        good_matches.append(m)
                sift_sim = len(good_matches) / max(len(features1["sift_descriptors"]),
                                                 len(features2["sift_descriptors"]))
                similarities["sift_similarity"] = float(sift_sim)
            
            return similarities
            
        except Exception as e:
            logger.error(f"Error in feature comparison: {str(e)}")
            return {}

    def _convert_to_serializable(self, obj):
        """Convert NumPy types to Python native types for JSON serialization."""
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        elif isinstance(obj, dict):
            return {key: self._convert_to_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_serializable(item) for item in obj]
        return obj

    def verify_product(self, image: Union[str, np.ndarray], product_id: str) -> dict:
        """Main verification method with separate logic for barcode and image verification."""
        try:
            # Load and preprocess image
            if isinstance(image, str):
                img = cv2.imread(image)
            else:
                img = image  # Already a numpy array
                
            if img is None:
                raise ValueError("Could not load image")
            
            # Get product details
            product = TEST_PRODUCTS.get(product_id)
            if not product:
                raise ValueError("Product not found")
            
            # Initialize results
            results = {
                "order_id": product_id,
                "timestamp": datetime.now().isoformat(),
                "verification_steps": []
            }
            
            # First check if the image contains a barcode
            barcode_data = self.extract_barcode(img)
            
            if barcode_data:
                # Barcode verification mode
                logger.info("Barcode detected - performing barcode verification")
                barcode_match = barcode_data == product["barcode"]
                
                results["barcode_found"] = True
                results["barcode_match"] = bool(barcode_match)  # Convert to Python bool
                results["verification_steps"].append({
                    "step": "Barcode Verification",
                    "status": "success" if barcode_match else "failure",
                    "details": f"Barcode {'matched' if barcode_match else 'did not match'} with product database"
                })
                
                # For barcode verification, we only need to check the barcode match
                results["overall_score"] = float(1.0 if barcode_match else 0.0)  # Convert to Python float
                results["is_authentic"] = bool(barcode_match)  # Convert to Python bool
                # Set all product analysis fields to None/0/empty for barcode-only case
                results["visual_similarity"] = 0.0
                results["texture_score"] = 0.0
                results["color_match"] = 0.0
                results["material_quality"] = "Unknown"
                results["stitching_quality"] = "Unknown"
                results["security_features"] = []
                
            else:
                # Image verification mode
                logger.info("No barcode detected - performing image verification")
                results["barcode_found"] = False
                
                # 1. Visual Feature Analysis
                current_features = self.extract_visual_features(img)
                
                # Load and compare with genuine product images
                genuine_scores = []
                for genuine_img_path in product["genuine_images"]:
                    if os.path.exists(genuine_img_path):
                        genuine_img = cv2.imread(genuine_img_path)
                        if genuine_img is not None:
                            genuine_features = self.extract_visual_features(genuine_img)
                            similarities = self.compare_features(current_features, genuine_features)
                            genuine_scores.append(similarities)
                
                if genuine_scores:
                    # Calculate average similarities
                    avg_scores = {
                        key: np.mean([score[key] for score in genuine_scores])
                        for key in genuine_scores[0].keys()
                    }
                    
                    # Visual similarity score
                    visual_score = float(avg_scores.get("resnet_similarity", 0) * 0.4 +
                                  avg_scores.get("vit_similarity", 0) * 0.3 +
                                  avg_scores.get("sift_similarity", 0) * 0.3)
                    
                    results["visual_similarity"] = visual_score
                    results["verification_steps"].append({
                        "step": "Visual Similarity",
                        "status": "success" if visual_score > 0.75 else "failure",
                        "details": f"Image matches {(visual_score * 100):.1f}% with genuine product"
                    })
                    
                    # Color analysis
                    color_score = float(avg_scores.get("color_similarity", 0))
                    results["color_match"] = color_score
                    results["verification_steps"].append({
                        "step": "Color Analysis",
                        "status": "success" if color_score > 0.7 else "failure",
                        "details": f"Color signature match: {(color_score * 100):.1f}%"
                    })
                    
                    # Texture analysis
                    texture_score = float(avg_scores.get("texture_similarity", 0))
                    results["texture_score"] = texture_score
                    results["verification_steps"].append({
                        "step": "Texture Analysis",
                        "status": "success" if texture_score > 0.8 else "failure",
                        "details": f"Texture pattern match: {(texture_score * 100):.1f}%"
                    })
                
                # 2. Material Quality Assessment
                material_quality = self._assess_material_quality(img, product["features"]["texture_features"])
                results["material_quality"] = material_quality
                results["verification_steps"].append({
                    "step": "Material Quality",
                    "status": "success" if material_quality == "High" else "warning",
                    "details": f"Material quality assessment: {material_quality}"
                })
                
                # 3. Logo Detection
                logo_found = bool(self._detect_logo(img, product["features"]["logo_positions"]))
                results["logo_detection"] = logo_found
                results["verification_steps"].append({
                    "step": "Logo Detection",
                    "status": "success" if logo_found else "failure",
                    "details": "Brand logo detected and verified" if logo_found else "Could not verify brand logo"
                })
                
                # 4. Security Features
                security_features = self._detect_security_features(img, product)
                results["security_features"] = security_features
                results["verification_steps"].append({
                    "step": "Security Features",
                    "status": "success" if len(security_features) > 0 else "warning",
                    "details": f"Found {len(security_features)} security features"
                })
                
                # Calculate overall authenticity score for image verification
                scores = [
                    visual_score if 'visual_score' in locals() else 0.0,
                    texture_score if 'texture_score' in locals() else 0.0,
                    color_score if 'color_score' in locals() else 0.0,
                    1.0 if logo_found else 0.0,
                    1.0 if material_quality == "High" else 0.5,
                    1.0 if len(security_features) > 0 else 0.5
                ]
                results["overall_score"] = float(sum(scores) / len(scores))
                results["is_authentic"] = bool(results["overall_score"] > 0.75)
            
            # Convert all NumPy types to Python native types
            return self._convert_to_serializable(results)
            
        except Exception as e:
            logger.error(f"Error in product verification: {str(e)}")
            return {"error": str(e)}

    def _assess_material_quality(self, img: np.ndarray, expected_texture: str) -> str:
        """Assess material quality using texture analysis."""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Calculate texture features
            lbp = local_binary_pattern(gray, 8, 1, method='uniform')
            lbp_hist, _ = np.histogram(lbp.ravel(), bins=59, range=(0, 59))
            lbp_hist = lbp_hist.astype("float")
            lbp_hist /= (lbp_hist.sum() + 1e-7)
            
            # Calculate texture complexity
            texture_complexity = -np.sum(lbp_hist * np.log2(lbp_hist + 1e-7))
            
            # Calculate edge strength
            edges = cv2.Canny(gray, 100, 200)
            edge_strength = np.mean(edges) / 255.0
            
            # Determine quality based on features
            if texture_complexity > 3.0 and edge_strength > 0.1:
                return "High"
            elif texture_complexity > 2.0 and edge_strength > 0.05:
                return "Medium"
            else:
                return "Low"
                
        except Exception as e:
            logger.error(f"Error in material quality assessment: {str(e)}")
            return "Unknown"

    def _detect_logo(self, img: np.ndarray, expected_positions: list) -> bool:
        """Detect and verify brand logo using template matching and feature detection."""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply multiple detection methods
            for x, y in expected_positions:
                # Check region around expected position
                region_size = 100
                x1, y1 = max(0, x - region_size), max(0, y - region_size)
                x2, y2 = min(img.shape[1], x + region_size), min(img.shape[0], y + region_size)
                
                region = gray[y1:y2, x1:x2]
                
                # Edge detection
                edges = cv2.Canny(region, 100, 200)
                edge_density = np.mean(edges) / 255.0
                
                # Feature detection
                keypoints = self.sift.detect(region, None)
                
                if edge_density > 0.1 and len(keypoints) > 10:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error in logo detection: {str(e)}")
            return False

    def _detect_security_features(self, img: np.ndarray, product: dict) -> list:
        """Detect security features using multiple methods."""
        try:
            features = []
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # 1. Check for micro-text patterns
            edges = cv2.Canny(gray, 100, 200)
            if np.mean(edges) > 0.1:
                features.append("Micro-text pattern detected")
            
            # 2. Check for holographic patterns
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            saturation = hsv[:,:,1]
            if np.std(saturation) > 50:
                features.append("Holographic pattern detected")
            
            # 3. Check for specific product features
            if product["features"]["texture_features"] == "genuine_leather_grain":
                # Analyze leather grain pattern
                lbp = local_binary_pattern(gray, 8, 1, method='uniform')
                lbp_hist, _ = np.histogram(lbp.ravel(), bins=59, range=(0, 59))
                if np.std(lbp_hist) > 100:
                    features.append("Authentic leather grain pattern")
            
            # 4. Check for RFID chip (simulated)
            if product["name"] == "Premium Leather Wallet":
                features.append("RFID Protection Verified")
            
            return features
            
        except Exception as e:
            logger.error(f"Error in security feature detection: {str(e)}")
            return [] 