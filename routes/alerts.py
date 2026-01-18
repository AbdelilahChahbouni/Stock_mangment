from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, Alert

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alerts_bp.route('', methods=['GET'])
@jwt_required()
def get_alerts():
    """
    Get all alerts
    
    Query parameters:
        - seen: Filter by seen status (true/false)
        - limit: Limit results (default: 50)
    
    Returns:
        {
            "alerts": [...],
            "total": 10,
            "unread_count": 5
        }
    """
    query = Alert.query
    
    # Seen filter
    seen = request.args.get('seen', '').lower()
    if seen == 'true':
        query = query.filter(Alert.seen == True)
    elif seen == 'false':
        query = query.filter(Alert.seen == False)
    
    # Limit
    limit = int(request.args.get('limit', 50))
    
    # Get alerts (unread first, then by date)
    alerts = query.order_by(Alert.seen.asc(), Alert.created_at.desc()).limit(limit).all()
    
    # Count unread
    unread_count = Alert.query.filter_by(seen=False).count()
    
    return jsonify({
        'alerts': [alert.to_dict() for alert in alerts],
        'total': len(alerts),
        'unread_count': unread_count
    }), 200

@alerts_bp.route('/<int:alert_id>/mark-read', methods=['PUT'])
@jwt_required()
def mark_alert_read(alert_id):
    """
    Mark alert as read
    
    Returns:
        {
            "message": "Alert marked as read",
            "alert": {...}
        }
    """
    alert = Alert.query.get(alert_id)
    
    if not alert:
        return jsonify({'error': 'Alert not found'}), 404
    
    alert.seen = True
    db.session.commit()
    
    return jsonify({
        'message': 'Alert marked as read',
        'alert': alert.to_dict()
    }), 200

@alerts_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """
    Get count of unread alerts
    
    Returns:
        {
            "unread_count": 5
        }
    """
    unread_count = Alert.query.filter_by(seen=False).count()
    
    return jsonify({'unread_count': unread_count}), 200

@alerts_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_read():
    """
    Mark all alerts as read
    
    Returns:
        {
            "message": "All alerts marked as read",
            "count": 5
        }
    """
    unread_alerts = Alert.query.filter_by(seen=False).all()
    count = len(unread_alerts)
    
    for alert in unread_alerts:
        alert.seen = True
    
    db.session.commit()
    
    return jsonify({
        'message': 'All alerts marked as read',
        'count': count
    }), 200
