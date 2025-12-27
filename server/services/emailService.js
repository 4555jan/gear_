const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Your Gmail address
          pass: process.env.EMAIL_PASS  // Your Gmail app password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.log('❌ Email service connection failed:', error.message);
        } else {
          console.log('✅ Email service ready');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  // Send account activation email
  async sendActivationEmail(user, activationToken, workshop) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const activationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/activate-account?token=${activationToken}&email=${user.email}`;

    const mailOptions = {
      from: {
        name: 'GearGuard CMMS',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: 'Activate Your GearGuard CMMS Account',
      html: this.getActivationEmailTemplate(user, activationUrl, workshop)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Activation email sent to:', user.email);
      return info;
    } catch (error) {
      console.error('❌ Failed to send activation email:', error.message);
      throw error;
    }
  }

  // Send welcome email to new user
  async sendWelcomeEmail(user, temporaryPassword, workshop) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: {
        name: 'GearGuard CMMS',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: 'Welcome to GearGuard CMMS - Account Created',
      html: this.getWelcomeEmailTemplate(user, temporaryPassword, workshop)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to:', user.email);
      return info;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: {
        name: 'GearGuard CMMS',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: 'GearGuard CMMS - Password Reset Request',
      html: this.getPasswordResetEmailTemplate(user, resetUrl)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent to:', user.email);
      return info;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      throw error;
    }
  }

  // Send maintenance notification
  async sendMaintenanceNotification(user, maintenanceRequest) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: {
        name: 'GearGuard CMMS',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: `New Maintenance Request Assigned - ${maintenanceRequest.title}`,
      html: this.getMaintenanceNotificationTemplate(user, maintenanceRequest)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Maintenance notification sent to:', user.email);
      return info;
    } catch (error) {
      console.error('❌ Failed to send maintenance notification:', error.message);
      throw error;
    }
  }

  // Welcome email template
  getWelcomeEmailTemplate(user, temporaryPassword, workshop) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to GearGuard CMMS</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content { 
          padding: 30px; 
        }
        .credentials {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #007bff;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛠️ Welcome to GearGuard CMMS</h1>
          <p>Your account has been created successfully!</p>
        </div>
        
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          
          <p>Welcome to GearGuard CMMS! Your account has been created and you can now access the maintenance management system.</p>
          
          <div class="credentials">
            <h3>📋 Your Account Details</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <p><strong>Employee ID:</strong> ${user.employeeId || 'Not assigned'}</p>
            ${workshop ? `<p><strong>Workshop:</strong> ${workshop.name} (${workshop.code})</p>` : ''}
            <p><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
          </div>
          
          <p><strong>⚠️ Important Security Notice:</strong> Please log in and change your password immediately for security reasons.</p>
          
          <h3>🚀 Getting Started</h3>
          <ul>
            <li>Log in using your email and temporary password</li>
            <li>Complete your profile information</li>
            <li>Change your password</li>
            <li>Explore the dashboard and features</li>
          </ul>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" class="button">Login to GearGuard CMMS</a>
          
          <p style="margin-top: 30px;">If you have any questions or need assistance, please contact your system administrator or IT support.</p>
        </div>
        
        <div class="footer">
          <p>© 2025 GearGuard CMMS. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Account activation email template
  getActivationEmailTemplate(user, activationUrl, workshop) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Activate Your GearGuard CMMS Account</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content { 
          padding: 30px; 
        }
        .account-info {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #28a745;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #28a745;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
          font-weight: bold;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Welcome to GearGuard CMMS</h1>
          <p>You've been invited to join our maintenance management system!</p>
        </div>
        
        <div class="content">
          <h2>Hello ${user.name}!</h2>
          
          <p>You have been invited to join GearGuard CMMS as a team member. To get started, please activate your account by clicking the button below.</p>
          
          <div class="account-info">
            <h3>📋 Your Account Information</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            ${user.department ? `<p><strong>Department:</strong> ${user.department}</p>` : ''}
            ${workshop ? `<p><strong>Workshop:</strong> ${workshop.name} (${workshop.code})</p>` : ''}
          </div>
          
          <p><strong>🔐 Account Activation Required</strong></p>
          <p>Click the button below to activate your account and set up your password:</p>
          
          <a href="${activationUrl}" class="button">Activate Account & Set Password</a>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This activation link will expire in 7 days</li>
              <li>You must activate your account to access the system</li>
              <li>Keep this email safe until you complete activation</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px;">${activationUrl}</p>
          
          <h3>🎯 What's Next?</h3>
          <p>After activating your account, you'll be able to:</p>
          <ul>
            <li>Access the maintenance management dashboard</li>
            <li>View and manage equipment</li>
            <li>Create and track maintenance requests</li>
            <li>Collaborate with your team</li>
          </ul>
          
          <p>If you have any questions, please contact your system administrator.</p>
        </div>
        
        <div class="footer">
          <p>© 2025 GearGuard CMMS. All rights reserved.</p>
          <p>This invitation was sent to ${user.email}. If you didn't expect this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Password reset email template
  getPasswordResetEmailTemplate(user, resetUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Password Reset - GearGuard CMMS</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content { 
          padding: 30px; 
        }
        .button {
          display: inline-block;
          background-color: #dc3545;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset Request</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${user.name},</h2>
          
          <p>We received a request to reset your password for your GearGuard CMMS account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p style="margin-top: 30px;"><strong>⚠️ Security Notice:</strong></p>
          <ul>
            <li>This link will expire in 1 hour for security reasons</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Never share this link with anyone</li>
          </ul>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>
        </div>
        
        <div class="footer">
          <p>© 2025 GearGuard CMMS. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Maintenance notification template
  getMaintenanceNotificationTemplate(user, maintenanceRequest) {
    const priorityColors = {
      'Low': '#28a745',
      'Medium': '#ffc107',
      'High': '#fd7e14',
      'Critical': '#dc3545'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Maintenance Assignment - GearGuard CMMS</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content { 
          padding: 30px; 
        }
        .priority {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: bold;
          background-color: ${priorityColors[maintenanceRequest.priority] || '#6c757d'};
        }
        .details {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔧 New Maintenance Assignment</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${user.name},</h2>
          
          <p>You have been assigned a new maintenance request that requires your attention.</p>
          
          <div class="details">
            <h3>📋 Request Details</h3>
            <p><strong>Title:</strong> ${maintenanceRequest.title}</p>
            <p><strong>Priority:</strong> <span class="priority">${maintenanceRequest.priority}</span></p>
            <p><strong>Equipment:</strong> ${maintenanceRequest.equipment?.name || 'Not specified'}</p>
            <p><strong>Due Date:</strong> ${maintenanceRequest.dueDate ? new Date(maintenanceRequest.dueDate).toLocaleDateString() : 'Not set'}</p>
            <p><strong>Description:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 4px; border-left: 3px solid #007bff;">${maintenanceRequest.description}</p>
          </div>
          
          <p>Please log in to the system to view complete details and update the status.</p>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/maintenance" class="button">View Maintenance Request</a>
        </div>
        
        <div class="footer">
          <p>© 2025 GearGuard CMMS. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();