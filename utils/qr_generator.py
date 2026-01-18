import os
import qrcode
from io import BytesIO
from PIL import Image

def generate_qr_code(data, part_id, save_folder='static/qrcodes'):
    """
    Generate QR code for a spare part
    
    Args:
        data: Data to encode in QR code (typically part ID or URL)
        part_id: ID of the spare part
        save_folder: Folder to save QR code images
    
    Returns:
        str: Relative path to the saved QR code image
    """
    # Create folder if it doesn't exist
    os.makedirs(save_folder, exist_ok=True)
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save image
    filename = f"part_{part_id}_qr.png"
    filepath = os.path.join(save_folder, filename)
    img.save(filepath)
    
    # Return relative path for URL
    return f"/qrcodes/{filename}"

def generate_qr_code_base64(data):
    """
    Generate QR code and return as base64 string (for API responses)
    
    Args:
        data: Data to encode in QR code
    
    Returns:
        str: Base64 encoded QR code image
    """
    import base64
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"
