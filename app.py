import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from models import db

def create_app(config_name='default'):
    """Application factory"""
    app = Flask(__name__, static_folder='static')
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    JWTManager(app)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.parts import parts_bp
    from routes.transactions import transactions_bp
    from routes.alerts import alerts_bp
    from routes.analytics import analytics_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(parts_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(analytics_bp)
    
    # Serve static files
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        """Serve uploaded images"""
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    @app.route('/qrcodes/<path:filename>')
    def serve_qrcode(filename):
        """Serve QR code images"""
        return send_from_directory(app.config['QR_CODE_FOLDER'], filename)
    
    @app.route('/')
    def index():
        """Serve main page"""
        return send_from_directory('static', 'index.html')
    
    @app.route('/<path:path>')
    def serve_static(path):
        """Serve other static files"""
        if os.path.exists(os.path.join('static', path)):
            return send_from_directory('static', path)
        # If file doesn't exist, serve index.html (for client-side routing)
        return send_from_directory('static', 'index.html')
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Create default admin user if not exists
        from models import User
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(username='admin', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("✓ Default admin user created (username: admin, password: admin123)")
    
    return app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    app.run(host='0.0.0.0', port=5000, debug=True)
