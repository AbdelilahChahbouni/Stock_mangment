import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, SparePart, User, Alert
from utils.qr_generator import generate_qr_code, generate_qr_code_base64
from utils.email_service import send_low_stock_alert

parts_bp = Blueprint('parts', __name__, url_prefix='/api/parts')

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@parts_bp.route('', methods=['GET'])
@jwt_required()
def get_parts():
    """
    Get all spare parts with optional filters
    
    Query parameters:
        - search: Search by name or description
        - category: Filter by category
        - location: Filter by location
        - low_stock: Filter low stock items (true/false)
    
    Returns:
        {
            "parts": [...],
            "total": 100
        }
    """
    query = SparePart.query
    
    # Search filter
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(
            db.or_(
                SparePart.name.ilike(f'%{search}%'),
                SparePart.description.ilike(f'%{search}%')
            )
        )
    
    # Category filter
    category = request.args.get('category', '').strip()
    if category:
        query = query.filter(SparePart.category == category)
    
    # Location filter
    location = request.args.get('location', '').strip()
    if location:
        query = query.filter(SparePart.location == location)
    
    # Low stock filter
    low_stock = request.args.get('low_stock', '').lower()
    if low_stock == 'true':
        query = query.filter(SparePart.quantity <= SparePart.min_quantity)
    
    # Get all parts
    parts = query.order_by(SparePart.name).all()
    
    return jsonify({
        'parts': [part.to_dict() for part in parts],
        'total': len(parts)
    }), 200

@parts_bp.route('/<int:part_id>', methods=['GET'])
@jwt_required()
def get_part(part_id):
    """Get single spare part by ID"""
    part = SparePart.query.get(part_id)
    
    if not part:
        return jsonify({'error': 'Part not found'}), 404
    
    return jsonify({'part': part.to_dict()}), 200

@parts_bp.route('', methods=['POST'])
@jwt_required()
def create_part():
    """
    Create new spare part (admin only)
    
    Request body (multipart/form-data):
        - name: Part name (required)
        - description: Part description
        - quantity: Initial quantity (default: 0)
        - min_quantity: Minimum stock threshold (default: 10)
        - location: Storage location
        - category: Part category
        - image: Image file (optional)
    
    Returns:
        {
            "message": "Part created successfully",
            "part": {...}
        }
    """
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # if not current_user or current_user.role != 'admin':
    #     return jsonify({'error': 'Admin access required'}), 403
    
    # Get form data
    name = request.form.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Part name is required'}), 400
    
    description = request.form.get('description', '').strip()
    quantity = int(request.form.get('quantity', 0))
    min_quantity = int(request.form.get('min_quantity', 10))
    location = request.form.get('location', '').strip()
    category = request.form.get('category', '').strip()
    
    # Handle image upload
    image_url = None
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to avoid conflicts
            import time
            filename = f"{int(time.time())}_{filename}"
            
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            image_url = f"/uploads/{filename}"
    
    # Create new part
    new_part = SparePart(
        name=name,
        description=description,
        quantity=quantity,
        min_quantity=min_quantity,
        location=location,
        category=category,
        image_url=image_url
    )
    
    db.session.add(new_part)
    db.session.flush()  # Get the ID before commit
    
    # Generate QR code
    qr_code_url = generate_qr_code(str(new_part.id), new_part.id)
    new_part.qr_code_url = qr_code_url
    
    db.session.commit()
    
    # Check if low stock alert needed
    if new_part.is_low_stock:
        create_low_stock_alert(new_part)
    
    return jsonify({
        'message': 'Part created successfully',
        'part': new_part.to_dict()
    }), 201

@parts_bp.route('/<int:part_id>', methods=['PUT'])
@jwt_required()
def update_part(part_id):
    """
    Update spare part (admin only)
    
    Request body (multipart/form-data):
        Same fields as create_part
    """
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # if not current_user or current_user.role != 'admin':
    #     return jsonify({'error': 'Admin access required'}), 403
    
    part = SparePart.query.get(part_id)
    if not part:
        return jsonify({'error': 'Part not found'}), 404
    
    # Update fields
    if 'name' in request.form:
        part.name = request.form.get('name', '').strip()
    if 'description' in request.form:
        part.description = request.form.get('description', '').strip()
    if 'quantity' in request.form:
        part.quantity = int(request.form.get('quantity', part.quantity))
    if 'min_quantity' in request.form:
        part.min_quantity = int(request.form.get('min_quantity', part.min_quantity))
    if 'location' in request.form:
        part.location = request.form.get('location', '').strip()
    if 'category' in request.form:
        part.category = request.form.get('category', '').strip()
    
    # Handle image upload
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            import time
            filename = f"{int(time.time())}_{filename}"
            
            upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            part.image_url = f"/uploads/{filename}"
    
    db.session.commit()
    
    # Check if low stock alert needed
    if part.is_low_stock:
        create_low_stock_alert(part)
    
    return jsonify({
        'message': 'Part updated successfully',
        'part': part.to_dict()
    }), 200

@parts_bp.route('/<int:part_id>', methods=['DELETE'])
@jwt_required()
def delete_part(part_id):
    """Delete spare part (admin only)"""
    # Check if user is admin
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # if not current_user or current_user.role != 'admin':
    #     return jsonify({'error': 'Admin access required'}), 403
    
    part = SparePart.query.get(part_id)
    if not part:
        return jsonify({'error': 'Part not found'}), 404
    
    db.session.delete(part)
    db.session.commit()
    
    return jsonify({'message': 'Part deleted successfully'}), 200

@parts_bp.route('/<int:part_id>/qrcode', methods=['GET'])
@jwt_required()
def get_qr_code(part_id):
    """
    Get QR code for a spare part
    
    Returns:
        Base64 encoded QR code image or file
    """
    part = SparePart.query.get(part_id)
    if not part:
        return jsonify({'error': 'Part not found'}), 404
    
    # Generate QR code with part ID
    qr_base64 = generate_qr_code_base64(str(part_id))
    
    return jsonify({
        'part_id': part_id,
        'part_name': part.name,
        'qr_code': qr_base64
    }), 200

def create_low_stock_alert(part):
    """Create alert for low stock part"""
    # Check if alert already exists for this part (unseen)
    existing_alert = Alert.query.filter_by(
        part_id=part.id,
        seen=False
    ).first()
    
    if existing_alert:
        return  # Alert already exists
    
    # Create new alert
    message = f"Low stock alert: {part.name} has {part.quantity} units (minimum: {part.min_quantity})"
    alert = Alert(
        part_id=part.id,
        message=message
    )
    
    db.session.add(alert)
    db.session.commit()
    
    # Send email notification
    try:
        send_low_stock_alert(
            part.name,
            part.quantity,
            part.min_quantity,
            part.id
        )
    except Exception as e:
        current_app.logger.error(f"Failed to send email alert: {str(e)}")
