from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    """User model for authentication and authorization"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='technician')  # admin or technician
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SparePart(db.Model):
    """Spare part model"""
    __tablename__ = 'spare_parts'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    min_quantity = db.Column(db.Integer, nullable=False, default=10)
    location = db.Column(db.String(100))
    category = db.Column(db.String(100), index=True)
    image_url = db.Column(db.String(500))
    qr_code_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Supplier relationship
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=True, index=True)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='spare_part', lazy=True, cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='spare_part', lazy=True, cascade='all, delete-orphan')
    
    @property
    def is_low_stock(self):
        """Check if stock is below minimum"""
        return self.quantity <= self.min_quantity
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'quantity': self.quantity,
            'min_quantity': self.min_quantity,
            'location': self.location,
            'category': self.category,
            'image_url': self.image_url,
            'qr_code_url': self.qr_code_url,
            'is_low_stock': self.is_low_stock,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Supplier(db.Model):
    """Supplier model"""
    __tablename__ = 'suppliers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    contact_person = db.Column(db.String(200))
    email = db.Column(db.String(120), index=True)
    phone = db.Column(db.String(50))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    spare_parts = db.relationship('SparePart', backref='supplier', lazy=True)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'contact_person': self.contact_person,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Transaction(db.Model):
    """Transaction model for stock IN/OUT operations"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    part_id = db.Column(db.Integer, db.ForeignKey('spare_parts.id'), nullable=False, index=True)
    type = db.Column(db.String(10), nullable=False)  # IN or OUT
    quantity = db.Column(db.Integer, nullable=False)
    machine = db.Column(db.String(100))  # Machine name/ID
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else None,
            'part_id': self.part_id,
            'part_name': self.spare_part.name if self.spare_part else None,
            'type': self.type,
            'quantity': self.quantity,
            'machine': self.machine,
            'notes': self.notes,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Alert(db.Model):
    """Alert model for low stock notifications"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    part_id = db.Column(db.Integer, db.ForeignKey('spare_parts.id'), nullable=False, index=True)
    message = db.Column(db.String(500), nullable=False)
    seen = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'part_id': self.part_id,
            'part_name': self.spare_part.name if self.spare_part else None,
            'message': self.message,
            'seen': self.seen,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
