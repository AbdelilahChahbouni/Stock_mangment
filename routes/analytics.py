from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, SparePart, Alert, Transaction
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/overview', methods=['GET'])
@jwt_required()
def get_overview():
    """Get overall inventory statistics"""
    try:
        # Total parts count
        total_parts = SparePart.query.count()
        
        # Low stock items count
        low_stock_count = SparePart.query.filter(SparePart.quantity <= SparePart.min_quantity).count()
        
        # Out of stock items count
        out_of_stock_count = SparePart.query.filter(SparePart.quantity == 0).count()
        
        # Total quantity across all parts
        total_quantity = db.session.query(func.sum(SparePart.quantity)).scalar() or 0
        
        # Categories breakdown
        categories = db.session.query(
            SparePart.category,
            func.count(SparePart.id).label('count')
        ).group_by(SparePart.category).all()
        
        categories_data = [
            {'category': cat or 'Uncategorized', 'count': count}
            for cat, count in categories
        ]
        
        # Total alerts
        total_alerts = Alert.query.count()
        unread_alerts = Alert.query.filter_by(seen=False).count()
        
        return jsonify({
            'total_parts': total_parts,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'total_quantity': total_quantity,
            'categories': categories_data,
            'total_alerts': total_alerts,
            'unread_alerts': unread_alerts
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/stock-distribution', methods=['GET'])
@jwt_required()
def get_stock_distribution():
    """Get stock distribution by category and location"""
    try:
        # Stock by category
        category_distribution = db.session.query(
            SparePart.category,
            func.sum(SparePart.quantity).label('total_quantity'),
            func.count(SparePart.id).label('part_count')
        ).group_by(SparePart.category).all()
        
        category_data = [
            {
                'category': cat or 'Uncategorized',
                'total_quantity': int(qty or 0),
                'part_count': count
            }
            for cat, qty, count in category_distribution
        ]
        
        # Stock by location
        location_distribution = db.session.query(
            SparePart.location,
            func.sum(SparePart.quantity).label('total_quantity'),
            func.count(SparePart.id).label('part_count')
        ).group_by(SparePart.location).all()
        
        location_data = [
            {
                'location': loc or 'Unknown',
                'total_quantity': int(qty or 0),
                'part_count': count
            }
            for loc, qty, count in location_distribution
        ]
        
        return jsonify({
            'by_category': category_data,
            'by_location': location_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/low-stock', methods=['GET'])
@jwt_required()
def get_low_stock_analysis():
    """Get detailed low stock analysis"""
    try:
        # Get all low stock parts
        low_stock_parts = SparePart.query.filter(
            SparePart.quantity <= SparePart.min_quantity
        ).order_by(SparePart.quantity.asc()).all()
        
        low_stock_data = []
        for part in low_stock_parts:
            stock_percentage = (part.quantity / part.min_quantity * 100) if part.min_quantity > 0 else 0
            low_stock_data.append({
                'id': part.id,
                'name': part.name,
                'category': part.category,
                'location': part.location,
                'quantity': part.quantity,
                'min_quantity': part.min_quantity,
                'stock_percentage': round(stock_percentage, 2),
                'deficit': part.min_quantity - part.quantity
            })
        
        # Critical parts (0-25% of minimum stock)
        critical_parts = [p for p in low_stock_data if p['stock_percentage'] <= 25]
        
        # Warning parts (26-100% of minimum stock)
        warning_parts = [p for p in low_stock_data if 25 < p['stock_percentage'] <= 100]
        
        return jsonify({
            'low_stock_parts': low_stock_data,
            'critical_parts': critical_parts,
            'warning_parts': warning_parts,
            'total_low_stock': len(low_stock_data),
            'total_critical': len(critical_parts),
            'total_warning': len(warning_parts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/top-parts', methods=['GET'])
@jwt_required()
def get_top_parts():
    """Get top parts by various metrics"""
    try:
        # Top 10 parts by quantity
        top_by_quantity = SparePart.query.order_by(SparePart.quantity.desc()).limit(10).all()
        
        top_quantity_data = [
            {
                'id': part.id,
                'name': part.name,
                'category': part.category,
                'quantity': part.quantity
            }
            for part in top_by_quantity
        ]
        
        # Most critical parts (lowest stock percentage)
        all_parts = SparePart.query.filter(SparePart.min_quantity > 0).all()
        critical_parts = []
        
        for part in all_parts:
            stock_percentage = (part.quantity / part.min_quantity * 100)
            critical_parts.append({
                'id': part.id,
                'name': part.name,
                'category': part.category,
                'quantity': part.quantity,
                'min_quantity': part.min_quantity,
                'stock_percentage': round(stock_percentage, 2)
            })
        
        # Sort by stock percentage and get top 10 most critical
        critical_parts.sort(key=lambda x: x['stock_percentage'])
        top_critical = critical_parts[:10]
        
        return jsonify({
            'top_by_quantity': top_quantity_data,
            'most_critical': top_critical
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/api/analytics/alerts-summary', methods=['GET'])
@jwt_required()
def get_alerts_summary():
    """Get alerts analytics"""
    try:
        # Total alerts
        total_alerts = Alert.query.count()
        
        # Note: Alert model doesn't seem to have 'alert_type' based on models.py inspection (it has message, seen, created_at, part_id).
        # We'll skip breakdown by type if it doesn't exist.
        
        # Most frequently alerted parts
        part_alerts = db.session.query(
            SparePart.name,
            SparePart.category,
            func.count(Alert.id).label('alert_count')
        ).join(Alert, Alert.part_id == SparePart.id)\
         .group_by(SparePart.id, SparePart.name, SparePart.category)\
         .order_by(func.count(Alert.id).desc())\
         .limit(10).all()
        
        frequent_alerts = [
            {
                'part_name': name,
                'category': category,
                'alert_count': count
            }
            for name, category, count in part_alerts
        ]
        
        # Read vs unread
        read_count = Alert.query.filter_by(seen=True).count()
        unread_count = Alert.query.filter_by(seen=False).count()
        
        return jsonify({
            'total_alerts': total_alerts,
            'frequent_alerts': frequent_alerts,
            'read_count': read_count,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
