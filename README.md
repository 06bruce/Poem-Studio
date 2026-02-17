# Poem Studio - Next.js Version

A beautiful, full-stack poem creation and sharing platform built with **Next.js 14** and **MongoDB**.

## ✨ Features

### 🔐 Authentication
- User sign up and sign in with secure JWT tokens
- Password hashing with bcryptjs
- Persistent login sessions
- Token automatically included in API requests

### 📝 Poem Management
- Generate poems from external PoetryDB API
- Create and save poems to database
- **Edit poems within 10-minute window** (enforced on both frontend & backend)
- Delete poems (author only)
- View all poems with author attribution

### 👥 Social Features
- User profiles with poem collections
- User search functionality
- Trending users sidebar
- Like/unlike poems
- Follow system (ready for implementation)

### 🎨 User Experience
- Beautiful glass-morphism UI design
- Fully responsive (mobile, tablet, desktop)
- Real-time loading states and error handling
- Share poems as images
- Weather effects animation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. **Clone and install dependencies:**
```bash
cd poem-studio-nextjs
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open your browser:**
```
http://localhost:3000
```

## 📁 Project Structure

```
poem-studio-nextjs/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── poems/                # Poem CRUD endpoints
│   │   └── users/                # User-related endpoints
│   ├── profile/[username]/        # User profile pages
│   ├── globals.css               # Global styles
│   ├── layout.js                # Root layout
│   └── page.js                 # Home page
├── components/                   # React components
├── contexts/                    # React contexts
├── lib/                        # Utilities and models
│   ├── models/                  # Mongoose schemas
│   ├── mongodb.js               # Database connection
│   └── utils/auth.js            # Authentication utilities
└── public/                     # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **React Icons** - Icon library
- **html2canvas** - Image generation
- **react-hot-toast** - Toast notifications

### Backend
- **Next.js API Routes** - Server-side API
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Token authentication
- **bcryptjs** - Password hashing

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Login

### Poems
- `GET /api/poems` - Get all poems
- `GET /api/poems/[id]` - Get specific poem
- `POST /api/poems` - Create poem (auth required)
- `PUT /api/poems/[id]` - Edit poem (auth required, author only, 10-min window)
- `DELETE /api/poems/[id]` - Delete poem (auth required, author only)
- `POST /api/poems/[id]/like` - Like poem (auth required)
- `POST /api/poems/[id]/unlike` - Unlike poem (auth required)
- `GET /api/poems/following` - Get poems from followed users (auth required)

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/trending` - Get trending users
- `GET /api/users/[username]` - Get user profile
- `GET /api/users/[username]/poems` - Get user's poems
- `GET /api/users/notifications` - Get notifications (auth required)
- `GET /api/users/notifications/unread` - Get unread count (auth required)

## 🚀 Deployment

### Environment Setup
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_strong_secret_key
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Build and Deploy
```bash
npm run build
npm start
```

## 📈 Key Improvements from Original

### Next.js Benefits
- ✅ **Server-Side Rendering** for better SEO
- ✅ **API Routes** - No separate server needed
- ✅ **File-based routing** - Cleaner routing structure
- ✅ **Built-in optimizations** - Images, fonts, etc.
- ✅ **Better performance** - Automatic code splitting
- ✅ **Simplified deployment** - Single target

### Code Quality
- ✅ **TypeScript support** ready
- ✅ **Modern React patterns** - Hooks, contexts
- ✅ **Responsive design** maintained
- ✅ **Error handling** improved
- ✅ **Security** preserved and enhanced

## 🎉 Ready to Use!

Your Next.js Poem Studio application is fully implemented and ready for:
- ✅ Local development
- ✅ Testing and QA
- ✅ Production deployment
- ✅ Feature extension

**Happy coding!** 🚀

---

*Migration completed from React + Vite + Express to Next.js 14*
