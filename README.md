# Stock Management System

A comprehensive full-stack stock management system for tracking spare parts with QR code scanning, role-based access control, real-time alerts, and cross-platform support.

## Features

### Backend (Flask API)
- **Authentication**: JWT-based authentication with role-based access control (Admin/Technician)
- **Spare Parts Management**: Full CRUD operations with image upload and QR code generation
- **Stock Transactions**: Track stock IN/OUT operations with user attribution
- **Alerts**: Automatic low stock alerts with email notifications (Gmail SMTP)
- **RESTful API**: Well-documented endpoints for all operations

### Web Dashboard
- **Modern UI**: Built with vanilla HTML, CSS, and Tailwind CSS
- **Dashboard**: Overview with stats cards and recent transactions
- **Parts Management**: Search, filter, add, edit, delete spare parts
- **QR Code Generation**: Automatic QR code creation for each part
- **Transaction History**: View and export (CSV) all stock movements
- **Alerts**: Real-time low stock notifications

### Mobile App (Flutter)
- **QR Scanner**: Scan part QR codes for quick access
- **Stock Operations**: Perform IN/OUT transactions on the go
- **Cross-platform**: Works on Android and iOS

## Technology Stack

- **Backend**: Python 3.x, Flask, SQLAlchemy
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript, Tailwind CSS
- **Mobile**: Flutter
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Gmail SMTP

## Installation

### Prerequisites
- Python 3.8+
- pip
- Virtual environment (recommended)

### Setup

1. **Clone the repository**
```bash
cd /home/local-host/flask_projects/stock_managment
```

2. **Create virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate  # On Windows
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your settings (Gmail credentials, etc.)
```

5. **Run the application**
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Change these credentials in production!**

## Email Configuration (Gmail)

To enable low stock email alerts:

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update `.env` file:
```
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-digit-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
ALERT_EMAIL_RECIPIENTS=admin@example.com,manager@example.com
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user info

### Spare Parts
- `GET /api/parts` - List all parts (with filters)
- `GET /api/parts/<id>` - Get single part
- `POST /api/parts` - Create new part (admin only)
- `PUT /api/parts/<id>` - Update part (admin only)
- `DELETE /api/parts/<id>` - Delete part (admin only)
- `GET /api/parts/<id>/qrcode` - Get QR code

### Transactions
- `POST /api/transactions/in` - Add stock
- `POST /api/transactions/out` - Remove stock
- `GET /api/transactions` - List transactions (with filters)

### Alerts
- `GET /api/alerts` - List all alerts
- `GET /api/alerts/unread-count` - Get unread count
- `PUT /api/alerts/<id>/mark-read` - Mark alert as read
- `PUT /api/alerts/mark-all-read` - Mark all as read

## Docker Deployment

```bash
docker-compose up --build
```

Access the application at `http://localhost:5000`

## Project Structure

```
stock_managment/
├── app.py                 # Main Flask application
├── config.py              # Configuration
├── models.py              # Database models
├── requirements.txt       # Python dependencies
├── routes/                # API routes
│   ├── auth.py
│   ├── parts.py
│   ├── transactions.py
│   └── alerts.py
├── utils/                 # Utilities
│   ├── qr_generator.py
│   └── email_service.py
├── static/                # Web frontend
│   ├── index.html
│   ├── dashboard.html
│   ├── parts.html
│   ├── transactions.html
│   ├── alerts.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       ├── parts.js
│       ├── transactions.js
│       └── alerts.js
└── mobile_app/            # Flutter mobile app
    └── lib/
```

## License

MIT License

## Support

For issues and questions, please open an issue on the repository.
