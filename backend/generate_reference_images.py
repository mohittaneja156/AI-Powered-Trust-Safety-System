import cv2
import numpy as np
import os
from PIL import Image
import random

def create_variations(image_path, output_prefix, is_genuine=True):
    """Create variations of an image with different angles, lighting, and perspectives."""
    try:
        # Read the image
        img = cv2.imread(image_path)
        if img is None:
            print(f"Could not read image: {image_path}")
            return
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_prefix), exist_ok=True)
        
        # Generate variations
        variations = []
        
        # 1. Original image
        variations.append(("original", img))
        
        # 2. Rotation variations
        angles = [30, 45, 60, -30]
        for angle in angles:
            matrix = cv2.getRotationMatrix2D((img.shape[1]/2, img.shape[0]/2), angle, 1)
            rotated = cv2.warpAffine(img, matrix, (img.shape[1], img.shape[0]))
            variations.append((f"rotated_{angle}", rotated))
        
        # 3. Lighting variations
        # Bright
        bright = cv2.convertScaleAbs(img, alpha=1.2, beta=30)
        variations.append(("bright", bright))
        
        # Dark
        dark = cv2.convertScaleAbs(img, alpha=0.8, beta=-30)
        variations.append(("dark", dark))
        
        # Warm
        warm = cv2.convertScaleAbs(img, alpha=1.1, beta=10)
        warm[:,:,0] = cv2.add(warm[:,:,0], 20)  # Increase red channel
        variations.append(("warm", warm))
        
        # Cool
        cool = cv2.convertScaleAbs(img, alpha=1.1, beta=10)
        cool[:,:,2] = cv2.add(cool[:,:,2], 20)  # Increase blue channel
        variations.append(("cool", cool))
        
        # 4. Perspective variations
        height, width = img.shape[:2]
        src_points = np.float32([[0, 0], [width, 0], [0, height], [width, height]])
        
        # Left perspective
        dst_points = np.float32([[width*0.1, 0], [width*0.9, 0], [0, height], [width, height]])
        matrix = cv2.getPerspectiveTransform(src_points, dst_points)
        left_perspective = cv2.warpPerspective(img, matrix, (width, height))
        variations.append(("left_perspective", left_perspective))
        
        # Right perspective
        dst_points = np.float32([[0, 0], [width*0.9, 0], [width*0.1, height], [width, height]])
        matrix = cv2.getPerspectiveTransform(src_points, dst_points)
        right_perspective = cv2.warpPerspective(img, matrix, (width, height))
        variations.append(("right_perspective", right_perspective))
        
        # 5. Add noise (only for fake images)
        if not is_genuine:
            # Gaussian noise
            noise = np.random.normal(0, 25, img.shape).astype(np.uint8)
            noisy = cv2.add(img, noise)
            variations.append(("noisy", noisy))
            
            # Blur
            blurred = cv2.GaussianBlur(img, (5, 5), 0)
            variations.append(("blurred", blurred))
        
        # Save all variations
        for name, variation in variations:
            output_path = f"{output_prefix}_{name}.jpg"
            cv2.imwrite(output_path, variation)
            print(f"Generated {output_path}")
            
    except Exception as e:
        print(f"Error creating variations for {image_path}: {str(e)}")

def generate_all_reference_images():
    """Generate reference images for all products."""
    # Product types and their base images
    products = {
        "stool": {
            "genuine": "product_images/stool_genuine.jpg",
            "fake": "product_images/stool_fake.jpg"
        },
        "heavy_stool": {
            "genuine": "product_images/heavy_stool_genuine.jpg",
            "fake": "product_images/heavy_stool_fake.jpg"
        },
        "wallet": {
            "genuine": "product_images/wallet_genuine.jpg",
            "fake": "product_images/wallet_fake.jpg"
        }
    }
    
    # Generate variations for each product
    for product_type, images in products.items():
        # Generate genuine variations
        if os.path.exists(images["genuine"]):
            create_variations(
                images["genuine"],
                f"product_images/{product_type}_genuine",
                is_genuine=True
            )
        
        # Generate fake variations
        if os.path.exists(images["fake"]):
            create_variations(
                images["fake"],
                f"product_images/{product_type}_fake",
                is_genuine=False
            )

if __name__ == "__main__":
    generate_all_reference_images() 