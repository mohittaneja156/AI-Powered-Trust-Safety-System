import qrcode
import barcode
from barcode.writer import ImageWriter
import os
from PIL import Image, ImageOps

def generate_test_barcodes():
    """Generate test barcodes and QR codes with improved quality for all products in the database"""
    # Create output directory
    os.makedirs('test_barcodes', exist_ok=True)
    
    # Common options for better scanning
    options = {
        'module_height': 15.0,  # Taller bars
        'module_width': 0.3,    # Wider bars
        'quiet_zone': 6.0,      # Larger quiet zone
        'font_size': 2,         # Smaller text
        'text_distance': 5.0,   # Text closer to barcode
    }
    
    # Barcodes for each product (order_id: barcode_value)
    product_barcodes = {
        'stool_code128': 'FSS2024001',
        'heavy_stool_code128': 'HSS2024001',
        'wallet_code128': 'LW2024GENUINE001',
    }

    for filename, value in product_barcodes.items():
        code128 = barcode.get('code128', value, writer=ImageWriter())
        code128.writer_options = options
        code128.save(f'test_barcodes/{filename}')

    # Generate EAN13 barcode (unrelated, for demo)
    ean = barcode.get('ean13', '123456789012', writer=ImageWriter())
    ean.writer_options = options
    ean.save('test_barcodes/test_ean13')

    # Generate QR code with better settings (unrelated, for demo)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # Higher error correction
        box_size=12,  # Larger boxes
        border=6,     # Larger border
    )
    qr.add_data('TEST-QR-CODE-1')
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_img = qr_img.resize((400, 400), Image.Resampling.LANCZOS)
    qr_img = ImageOps.expand(qr_img, border=40, fill='white')
    qr_img.save('test_barcodes/test_qr.png', quality=95)
    
    print("Generated high-quality test barcodes in 'test_barcodes' directory:")
    print("1. Code128 barcode (FSS2024001) for Folding Step Stool")
    print("2. Code128 barcode (HSS2024001) for Heavy Duty Step Stool")
    print("3. Code128 barcode (LW2024GENUINE001) for Premium Leather Wallet")
    print("4. EAN13 barcode (123456789012) [demo]")
    print("5. QR code (TEST-QR-CODE-1) [demo]")
    print("\nTips for scanning:")
    print("- Ensure good lighting")
    print("- Hold camera steady and parallel to barcode")
    print("- Try different distances (15-30cm)")
    print("- Make sure the entire barcode is visible")

if __name__ == "__main__":
    generate_test_barcodes() 