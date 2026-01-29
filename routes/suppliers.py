from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Supplier

suppliers_bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')

@suppliers_bp.route('', methods=['GET'])
@jwt_required()
def get_suppliers():
    """Get all suppliers"""
    suppliers = Supplier.query.order_by(Supplier.name).all()
    return jsonify({
        'suppliers': [s.to_dict() for s in suppliers],
        'total': len(suppliers)
    }), 200

@suppliers_bp.route('', methods=['POST'])
@jwt_required()
def add_supplier():
    """Add a new supplier"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Supplier name is required'}), 400
    
    supplier = Supplier(
        name=data.get('name'),
        contact_person=data.get('contact_person'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address')
    )
    
    db.session.add(supplier)
    db.session.commit()
    
    return jsonify({
        'message': 'Supplier added successfully',
        'supplier': supplier.to_dict()
    }), 201

@suppliers_bp.route('/<int:supplier_id>', methods=['GET'])
@jwt_required()
def get_supplier(supplier_id):
    """Get a specific supplier"""
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Supplier not found'}), 404
    
    return jsonify(supplier.to_dict()), 200

@suppliers_bp.route('/<int:supplier_id>', methods=['PUT'])
@jwt_required()
def update_supplier(supplier_id):
    """Update a supplier"""
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Supplier not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'name' in data:
        supplier.name = data['name']
    if 'contact_person' in data:
        supplier.contact_person = data['contact_person']
    if 'email' in data:
        supplier.email = data['email']
    if 'phone' in data:
        supplier.phone = data['phone']
    if 'address' in data:
        supplier.address = data['address']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Supplier updated successfully',
        'supplier': supplier.to_dict()
    }), 200

@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(supplier_id):
    """Delete a supplier"""
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Supplier not found'}), 404
    
    # Check if supplier has associated parts
    if supplier.spare_parts:
        return jsonify({'error': 'Cannot delete supplier with associated spare parts'}), 400
    
    db.session.delete(supplier)
    db.session.commit()
    
    return jsonify({'message': 'Supplier deleted successfully'}), 200
