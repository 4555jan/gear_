# Gmail Email Setup for GearGuard CMMS

## 📧 Email Configuration Setup

### 1. Generate Gmail App Password

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com/
   - Click on "Security" in the left sidebar

2. **Enable 2-Step Verification:**
   - If not already enabled, set up 2-Step Verification
   - This is required for App Passwords

3. **Create App Password:**
   - Search for "App passwords" in the security settings
   - Click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Enter "GearGuard CMMS" as the name
   - Copy the 16-character password generated

### 2. Update Environment Variables

Edit the `.env` file in the server directory:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
CLIENT_URL=http://localhost:3000
```

Replace:
- `your-gmail@gmail.com` with your Gmail address
- `your-16-char-app-password` with the App Password from step 1

### 3. Email Features Available

✅ **Welcome Emails** - Sent automatically when creating new users
✅ **Password Reset** - Users can reset their passwords via email
✅ **Maintenance Notifications** - Email alerts for maintenance assignments
✅ **Resend Welcome** - Admins can resend welcome emails with new passwords

### 4. Testing Email Functionality

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Create a test user:**
   - Log in as admin
   - Go to Users Management
   - Click "Add User"
   - Fill in the form and submit
   - Check if welcome email is received

3. **Test password reset:**
   - Go to login page
   - Click "Forgot Password"
   - Enter email and check for reset email

### 5. Email Templates

The system includes professional email templates for:

- **Welcome Email**: Account credentials and getting started guide
- **Password Reset**: Secure password reset with expiring links
- **Maintenance Notifications**: Assignment alerts with request details

### 6. Security Features

- App Password instead of main Gmail password
- Password reset tokens expire in 10 minutes
- Temporary passwords generated securely
- No sensitive data stored in emails

### 7. Troubleshooting

**Email not sending?**
- Check Gmail App Password is correct
- Verify 2-Step Verification is enabled
- Check server logs for email errors
- Test with a different Gmail account

**SSL/TLS Errors?**
- The system uses `rejectUnauthorized: false` for development
- For production, update email configuration

### 8. Production Considerations

For production environments:
- Use a dedicated email service (SendGrid, Amazon SES)
- Set up proper SSL certificates
- Configure email rate limiting
- Add email templates customization
- Set up email analytics and tracking

## 🚀 Ready to Use!

Once configured, the system will automatically handle all email communications for user management and system notifications.