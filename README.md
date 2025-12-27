# GearGuard - Enterprise CMMS System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-v18+-green.svg)
![MongoDB](https://img.shields.io/badge/database-MongoDB-brightgreen.svg)
![React](https://img.shields.io/badge/react-v18+-61dafb.svg)

> **The Ultimate Maintenance Tracker** - A comprehensive Computerized Maintenance Management System (CMMS) built with MERN stack, inspired by Odoo's maintenance module.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

GearGuard is an enterprise-grade Maintenance Management System designed to streamline maintenance operations across multiple workshops. It provides complete equipment lifecycle management, preventive and corrective maintenance workflows, team coordination, and real-time tracking of maintenance requests.

### Core Philosophy

The system seamlessly connects three critical components:
- **Equipment** (what needs maintenance)
- **Teams** (who performs the work)
- **Requests** (the maintenance tasks)

## ✨ Key Features

### 🔧 Equipment Management
- **Complete Asset Tracking**: Track all company assets with detailed information
- **Department & Employee Assignment**: Assign equipment to departments or specific employees
- **Maintenance History**: Full history of all maintenance activities
- **Location Tracking**: Physical location and work center assignment
- **Smart Buttons**: Quick access to related maintenance requests
- **MTBF & MTTR Metrics**: Automatic calculation of reliability metrics

### 👥 Team Management
- **Specialized Teams**: Create teams for different specializations (Electrical, Mechanical, IT, etc.)
- **Role-Based Assignment**: Team leads and members with specific roles
- **Workload Balancing**: Auto-assignment based on technician availability
- **Skills Tracking**: Match technician skills with equipment requirements
- **Performance Analytics**: Track team efficiency and response times

### 📝 Maintenance Request Workflow
- **Request Types**:
  - **Corrective**: Unplanned repairs (breakdowns)
  - **Preventive**: Scheduled maintenance
  - **Predictive**: Based on usage patterns
  - **Emergency**: Critical urgent repairs

- **Priority Levels**: Low, Medium, High, Critical, Emergency
- **Status Tracking**: New → Assigned → In Progress → Completed
- **Kanban Board**: Visual workflow management with drag-and-drop
- **Calendar View**: Schedule and view preventive maintenance
- **Auto-Assignment**: Intelligent assignment to available technicians

### 🏢 Multi-Workshop Support
- **Workshop Management**: Support for multiple workshops/locations
- **Capacity Tracking**: Monitor user and equipment capacity per workshop
- **Location-Based Filtering**: View data specific to each workshop
- **Operating Hours**: Configure working hours and time zones
- **Specialization**: Different workshops for different types of work

### 📧 Email Integration
- **User Invitations**: SaaS-style email invitations for new users
- **Account Activation**: Secure token-based activation system
- **Maintenance Notifications**: Automatic email notifications for:
  - New maintenance requests
  - Request assignments
  - Status updates
  - Completion notifications
- **Professional Templates**: Branded HTML email templates

### 📊 Analytics & Reporting
- **Dashboard Statistics**: Real-time metrics and KPIs
- **Equipment Performance**: MTBF, MTTR, failure predictions
- **Team Efficiency**: Response times, completion rates
- **Cost Tracking**: Labor hours and parts costs
- **Overdue Requests**: Automatic tracking of delayed work

### 🔐 Security & Access Control
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access
  - **Technician**: Maintenance execution and updates
  - **Employee**: Request creation and tracking
- **JWT Authentication**: Secure token-based authentication
- **Workshop-Level Permissions**: Users limited to their workshop
- **Audit Logging**: Track all user actions

### 📅 Calendar Integration
- **Maintenance Schedule**: Visual calendar for preventive maintenance
- **Event Creation**: Create maintenance requests from calendar
- **Multi-View Support**: Month, week, day views
- **Color Coding**: Visual priority indicators
- **Drag & Drop**: Reschedule maintenance easily

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **React Hook Form** - Form validation
- **React Hot Toast** - Notifications
- **Heroicons** - Beautiful icons
- **FullCalendar** - Calendar component

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcrypt.js** - Password hashing
- **Nodemailer** - Email service
- **Express Validator** - Input validation
- **CORS** - Cross-origin resource sharing

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Dashboard │  │ Equipment  │  │ Maintenance│        │
│  │   & Stats  │  │ Management │  │  Requests  │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Teams    │  │  Calendar  │  │   Users    │        │
│  │ Management │  │   View     │  │ Management │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
                          │
                          │ REST API
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Server (Express.js)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Middleware Layer                     │  │
│  │  • Authentication    • Validation                 │  │
│  │  • Authorization     • Error Handling             │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Controllers Layer                      │  │
│  │  • User          • Maintenance                    │  │
│  │  • Equipment     • Team                           │  │
│  │  • Workshop      • Email                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Database (MongoDB Atlas)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Users   │  │Equipment │  │Maintenance│             │
│  │Collection│  │Collection│  │ Requests  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Teams   │  │Workshops │  │  Audit   │             │
│  │Collection│  │Collection│  │   Logs   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Gmail account (for email service)
- Git

### Clone Repository

```bash
git clone https://github.com/4555jan/gear_.git
cd gear_
```

### Backend Setup

```bash
cd server
npm install
```

Create `.env` file in server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=your_mongodb_atlas_connection_string

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=24h

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=GearGuard CMMS <your_email@gmail.com>

# Client URL (for email links)
CLIENT_URL=http://localhost:5173
```

### Frontend Setup

```bash
cd client
npm install
```

Create `.env` file in client directory:

```env
VITE_API_URL=http://localhost:5000
```

### Start Development Servers

Terminal 1 (Backend):
```bash
cd server
node index.js
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

Access the application at `http://localhost:5173`

## ⚙️ Configuration

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account at https://cloud.mongodb.com
2. Create a new cluster
3. Create a database user with password
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string and add to `.env`

### Gmail App Password

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings → Security
3. Generate an App Password for "Mail"
4. Use this password in `EMAIL_PASSWORD` in `.env`

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-256-bit-secret` |
| `EMAIL_USER` | Gmail address | `your.email@gmail.com` |
| `EMAIL_PASSWORD` | Gmail app password | `xxxx xxxx xxxx xxxx` |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` |

## 🚀 Usage

### Creating Your First Maintenance Request

1. **Login** with your credentials
2. Navigate to **Equipment** → **Add Equipment**
3. Fill in equipment details and assign a maintenance team
4. Go to **Maintenance** → **Create Request**
5. Select equipment, type (Corrective/Preventive), priority
6. Assign to team or technician
7. Track progress on the Kanban board

### Setting Up Preventive Maintenance

1. Create a maintenance request with type **Preventive**
2. Set a **Scheduled Date**
3. View on **Calendar** to see all scheduled maintenance
4. Receive email notifications before due date

### Managing Teams

1. Go to **Teams** (Admin/Technician only)
2. Create team with specialization (Electrical, Mechanical, etc.)
3. Add team members (technicians)
4. Assign equipment to teams
5. Use auto-assignment for balanced workload

### Workshop Management

1. Navigate to **Settings** → **Workshops** (Admin only)
2. Create workshop with location and specializations
3. Set capacity and operating hours
4. Assign users and equipment to workshops

## 👥 User Roles

### Admin
- **Full System Access**: All modules and settings
- **User Management**: Invite users, assign roles, manage workshops
- **Workshop Configuration**: Create and manage multiple workshops
- **Analytics**: View system-wide reports and statistics
- **Audit Logs**: Access to all user action logs

### Technician
- **Maintenance Execution**: Accept, update, and complete requests
- **Equipment Access**: View and update equipment status
- **Team Coordination**: View team workload and assignments
- **Work Notes**: Add detailed notes and hours worked
- **Parts Tracking**: Record parts used in repairs

### Employee
- **Request Creation**: Create maintenance requests for equipment issues
- **Status Tracking**: View status of their submitted requests
- **Equipment View**: View equipment they are responsible for
- **Notifications**: Receive updates on their requests

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/register
POST /api/users/activate/:token
POST /api/users/forgot-password
POST /api/users/reset-password
```

### User Management

```http
GET    /api/users              # Get all users (Admin)
POST   /api/users              # Invite new user (Admin)
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user (Admin)
PUT    /api/users/:id/status   # Update user status
```

### Equipment Management

```http
GET    /api/equipment          # Get all equipment
POST   /api/equipment          # Create equipment
GET    /api/equipment/:id      # Get equipment by ID
PUT    /api/equipment/:id      # Update equipment
DELETE /api/equipment/:id      # Delete equipment
GET    /api/equipment/:id/maintenance  # Get maintenance history
```

### Maintenance Requests

```http
GET    /api/maintenance        # Get all requests
POST   /api/maintenance        # Create request
GET    /api/maintenance/:id    # Get request by ID
PUT    /api/maintenance/:id/assign    # Assign technician
PUT    /api/maintenance/:id/stage     # Update status
POST   /api/maintenance/:id/notes     # Add work note
GET    /api/maintenance/stats/dashboard  # Get statistics
GET    /api/maintenance/calendar       # Get calendar events
```

### Team Management

```http
GET    /api/teams              # Get all teams
POST   /api/teams              # Create team
GET    /api/teams/:id          # Get team by ID
PUT    /api/teams/:id          # Update team
DELETE /api/teams/:id          # Delete team
POST   /api/teams/:id/members  # Add team member
DELETE /api/teams/:id/members/:userId  # Remove member
```

### Workshop Management

```http
GET    /api/workshops          # Get all workshops
POST   /api/workshops          # Create workshop
GET    /api/workshops/:id      # Get workshop by ID
PUT    /api/workshops/:id      # Update workshop
DELETE /api/workshops/:id      # Delete workshop
```

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Real-time statistics and KPIs*

### Maintenance Kanban Board
![Kanban](docs/screenshots/kanban.png)
*Visual workflow management*

### Calendar View
![Calendar](docs/screenshots/calendar.png)
*Schedule preventive maintenance*

### Equipment Management
![Equipment](docs/screenshots/equipment.png)
*Complete asset tracking*

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Write clean, maintainable code

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Odoo Maintenance Module](https://www.odoo.com/app/maintenance)
- Built with guidance from [much. Consulting](https://much.consulting/)
- Icons by [Heroicons](https://heroicons.com/)
- UI components inspired by [Tailwind UI](https://tailwindui.com/)

## 📞 Support

For support, email support@gearguard.com or open an issue on GitHub.

## 🗺️ Roadmap

### Version 2.0 (Planned)
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with IoT sensors
- [ ] Predictive maintenance AI
- [ ] Parts inventory management
- [ ] QR code scanning for equipment
- [ ] Multi-language support
- [ ] Custom report builder
- [ ] Mobile notifications (Push)
- [ ] Offline mode support

### Version 1.1 (In Progress)
- [x] Multi-workshop support
- [x] Email notifications
- [x] Calendar view
- [x] User invitation system
- [ ] Export to PDF/Excel
- [ ] Advanced filtering
- [ ] Batch operations

## 💡 Best Practices

### Security
- Never commit `.env` files
- Use strong JWT secrets
- Enable MongoDB IP whitelisting
- Use HTTPS in production
- Implement rate limiting
- Regular security audits

### Performance
- Index MongoDB collections
- Implement pagination
- Optimize database queries
- Use caching where appropriate
- Compress API responses
- Lazy load components

### Deployment
- Use PM2 for Node.js process management
- Set up reverse proxy (Nginx)
- Enable CORS for production domains
- Configure MongoDB backups
- Monitor error logs
- Set up CI/CD pipeline

---

**Made with ❤️ for maintenance teams worldwide**

**Project Status**: ✅ Production Ready

**Last Updated**: December 27, 2025
