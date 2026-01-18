import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_email(subject, body, recipients):
    """
    Send email using Gmail SMTP
    
    Args:
        subject: Email subject
        body: Email body (HTML supported)
        recipients: List of recipient email addresses
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Get SMTP configuration from app config
        smtp_server = current_app.config['SMTP_SERVER']
        smtp_port = current_app.config['SMTP_PORT']
        smtp_username = current_app.config['SMTP_USERNAME']
        smtp_password = current_app.config['SMTP_PASSWORD']
        from_email = current_app.config['SMTP_FROM_EMAIL']
        
        # Check if email is configured
        if not smtp_username or not smtp_password:
            current_app.logger.warning("Email not configured. Skipping email notification.")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = ', '.join(recipients)
        
        # Attach HTML body
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        current_app.logger.info(f"Email sent successfully to {recipients}")
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
        return False

def send_low_stock_alert(part_name, current_quantity, min_quantity, part_id):
    """
    Send low stock alert email
    
    Args:
        part_name: Name of the spare part
        current_quantity: Current stock quantity
        min_quantity: Minimum stock threshold
        part_id: ID of the spare part
    
    Returns:
        bool: True if email sent successfully
    """
    # Check if alerts are enabled
    if not current_app.config.get('LOW_STOCK_ALERT_ENABLED', False):
        return False
    
    recipients = current_app.config.get('ALERT_EMAIL_RECIPIENTS', [])
    if not recipients or recipients == ['']:
        current_app.logger.warning("No alert recipients configured")
        return False
    
    subject = f"⚠️ Low Stock Alert: {part_name}"
    
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #dc2626;">Low Stock Alert</h2>
            <p>The following spare part is running low on stock:</p>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">{part_name}</h3>
                <p style="margin: 5px 0;"><strong>Current Quantity:</strong> {current_quantity}</p>
                <p style="margin: 5px 0;"><strong>Minimum Quantity:</strong> {min_quantity}</p>
                <p style="margin: 5px 0;"><strong>Part ID:</strong> {part_id}</p>
            </div>
            
            <p>Please restock this item as soon as possible.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
                This is an automated alert from the Stock Management System.
            </p>
        </body>
    </html>
    """
    
    return send_email(subject, body, recipients)
