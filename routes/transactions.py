from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Transaction, SparePart, User, Alert
from utils.email_service import send_low_stock_alert
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

@transactions_bp.route('/in', methods=['POST'])
@jwt_required()
def stock_in():
    """
    Add stock (IN transaction)
    
    Request body:
        {
            "part_id": 1,
            "quantity": 10,
            "notes": "Received from supplier"
        }
    
    Returns:
        {
            "message": "Stock added successfully",
            "transaction": {...},
            "part": {...}
        }
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('part_id') or not data.get('quantity'):
        return jsonify({'error': 'part_id and quantity are required'}), 400
    
    part_id = data.get('part_id')
    quantity = int(data.get('quantity'))
    notes = data.get('notes', '').strip()
    machine = data.get('machine', '').strip()
    
    if quantity <= 0:
        return jsonify({'error': 'Quantity must be positive'}), 400
    
    # Get spare part
    part = SparePart.query.get(part_id)
    if not part:
        return jsonify({'error': 'Part not found'}), 404
    
    # Create transaction
    transaction = Transaction(
        user_id=current_user_id,
        part_id=part_id,
        type='IN',
        quantity=quantity,
        machine=machine,
        notes=notes
    )
    
    # Update part quantity
    part.quantity += quantity
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Stock added successfully',
        'transaction': transaction.to_dict(),
        'part': part.to_dict()
    }), 201

@transactions_bp.route('/out', methods=['POST'])
@jwt_required()
def stock_out():
    """
    Remove stock (OUT transaction)
    
    Request body:
        {
            "part_id": 1,
            "quantity": 5,
            "notes": "Used for maintenance"
        }
    
    Returns:
        {
            "message": "Stock removed successfully",
            "transaction": {...},
            "part": {...}
        }
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('part_id') or not data.get('quantity'):
        return jsonify({'error': 'part_id and quantity are required'}), 400
    
    part_id = data.get('part_id')
    quantity = int(data.get('quantity'))
    notes = data.get('notes', '').strip()
    machine = data.get('machine', '').strip()
    
    if quantity <= 0:
        return jsonify({'error': 'Quantity must be positive'}), 400
    
    # Get spare part
    part = SparePart.query.get(part_id)
    if not part:
        return jsonify({'error': 'Part not found'}), 404
    
    # Check if enough stock available
    if part.quantity < quantity:
        return jsonify({
            'error': f'Insufficient stock. Available: {part.quantity}, Requested: {quantity}'
        }), 400
    
    # Create transaction
    transaction = Transaction(
        user_id=current_user_id,
        part_id=part_id,
        type='OUT',
        quantity=quantity,
        machine=machine,
        notes=notes
    )
    
    # Update part quantity
    part.quantity -= quantity
    
    db.session.add(transaction)
    db.session.commit()
    
    # Check if low stock alert needed
    if part.is_low_stock:
        create_low_stock_alert(part)
    
    return jsonify({
        'message': 'Stock removed successfully',
        'transaction': transaction.to_dict(),
        'part': part.to_dict()
    }), 201

@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    """
    Get all transactions with optional filters
    
    Query parameters:
        - part_id: Filter by part
        - user_id: Filter by user
        - type: Filter by type (IN/OUT)
        - start_date: Filter from date (ISO format)
        - end_date: Filter to date (ISO format)
        - limit: Limit results (default: 100)
    
    Returns:
        {
            "transactions": [...],
            "total": 50
        }
    """
    query = Transaction.query
    
    # Part filter
    part_id = request.args.get('part_id')
    if part_id:
        query = query.filter(Transaction.part_id == int(part_id))
    
    # User filter
    user_id = request.args.get('user_id')
    if user_id:
        query = query.filter(Transaction.user_id == int(user_id))
    
    # Type filter
    trans_type = request.args.get('type', '').upper()
    if trans_type in ['IN', 'OUT']:
        query = query.filter(Transaction.type == trans_type)

    # Machine filter
    machine = request.args.get('machine')
    if machine:
        query = query.filter(Transaction.machine.ilike(f'%{machine}%'))
    
    # Date range filter
    start_date = request.args.get('start_date')
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Transaction.timestamp >= start)
        except ValueError:
            pass
    
    end_date = request.args.get('end_date')
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Transaction.timestamp <= end)
        except ValueError:
            pass
    
    # Limit
    limit = int(request.args.get('limit', 100))
    
    # Get transactions
    transactions = query.order_by(Transaction.timestamp.desc()).limit(limit).all()
    
    return jsonify({
        'transactions': [t.to_dict() for t in transactions],
        'total': len(transactions)
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
        print(f"Failed to send email alert: {str(e)}")
