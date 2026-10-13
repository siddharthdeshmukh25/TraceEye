# TraceEye 🌱

**Food. Trust. Trace.**

A comprehensive food traceability platform that turns every food batch into a verified digital passport with live risk monitoring, from farm to fork.

## 🚀 Features

### Core Functionality
- **Digital Food Passports** - Each batch gets a unique ID and QR code with origin, quality, quantity, and journey data
- **Multi-Persona Dashboard** - Tailored views for Farmers, Logistics, Regulators, and Consumers
- **Real-time Monitoring** - Temperature tracking, GPS location, and storage condition monitoring
- **QR Code Scanning** - Instant access to product information via mobile scanning
- **Visual Verification** - Tamper-evident seal verification with AI confidence scoring
- **Smart Recall System** - Targeted recalls based on actual risk levels instead of blanket recalls

### Authentication
- Email/Password authentication
- Phone number authentication with country code support
- Google OAuth integration
- Secure JWT token management
- Auto-logout on token expiration

### Dashboard Features
- **Overview** - Summary of batches, safety status, and alerts
- **Batch Registry** - Register and manage food batches
- **Safety & Recalls** - Monitor and manage product safety
- **GPS Tracking** - Real-time location monitoring
- **Seal Verification** - Visual verification of product seals
- **QR Food Passports** - Generate and manage QR codes

### Advanced Monitoring
- **Solar Telemetry Dashboard** - Monitor solar-powered storage units
- **Spoilage Risk Monitor** - AI-powered spoilage risk assessment
- **Vegetable Plot Dashboard** - Production and harvest tracking
- **System Status Panel** - Database health and cache management

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons
- **Animations**: Framer Motion
- **QR Generation**: qrcode.react
- **QR Scanning**: html5-qrcode
- **Charts**: Recharts
- **Image Export**: html2canvas

### Backend
- **Database**: MongoDB
- **Authentication**: Firebase Auth + Custom JWT
- **Image Storage**: Cloudinary
- **API**: Next.js API Routes

### Integration
- **Firebase**: Google OAuth
- **Cloudinary**: Image upload and management
- **MongoDB**: Data persistence

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project setup
- Cloudinary account

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/siddharthdeshmukh25/TraceEye.git
cd TraceEye
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment variables**
Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/traceeye

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

4. **Run the development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
npm start
```

## 🎯 Usage

### Getting Started

1. **Sign Up** - Create an account using email, phone, or Google
2. **Register a Batch** - Add your first food batch with origin and quality data
3. **Generate QR** - Each batch gets a unique QR code
4. **Monitor** - Track temperature, location, and storage conditions
5. **Verify** - Use visual verification to confirm seal integrity
6. **Share** - Share the QR passport with customers and partners

### Personas

#### Farmer View
- Register harvest data
- Manage storage logs
- Track quality metrics
- View batch registry

#### Logistics View
- Monitor transit data
- GPS tracking
- Temperature alerts
- Fleet status

#### Regulator View
- Compliance logs
- Safety audits
- Certification status
- Incident reports

#### Consumer View
- Product journey
- Quality assurance
- Sustainability info
- Product details

## 📱 Features in Detail

### QR Code Scanning
- Built-in camera access
- Real-time QR detection
- Instant batch lookup
- Mobile-optimized interface

### Smart Recall System
- Risk-based alerts (Safe, At Risk, Critical)
- Targeted recall notifications
- Impact analysis
- Batch quarantine management

### Visual Verification
- Image upload for seal verification
- AI confidence scoring
- Verification history
- Tamper detection

### System Monitoring
- Database health status
- Cache statistics
- Backup and restore functionality
- Real-time error tracking

## 🔒 Security

- JWT-based authentication
- Secure password hashing
- Token expiration handling
- CORS protection
- Input validation
- Secure file uploads

## 📊 Data Model

### Batch
- Unique batch ID
- Product information
- Origin data
- Quality grade
- Storage requirements
- Current status
- Quarantine status

### Alert
- Severity levels
- Affected locations
- Batch association
- Timestamps

### Card Visit
- GPS location
- Visitor information
- Device details
- Timestamps

### Visual Verification
- Image URL
- Verification status
- AI confidence
- Verification method
- Notes

## 🧪 Testing

Run the development server and navigate to:
- Home page: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Authentication: `http://localhost:3000/auth/login`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, email support@traceeye.com or visit our documentation.

## 🙏 Acknowledgments

- Built with Next.js and React
- Icons by Lucide
- Styled with Tailwind CSS
- Powered by MongoDB and Firebase

---

**TraceEye** - Making food traceability simple, secure, and smart. 🌱
