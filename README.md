# Letterbooked

A modern book discovery and review platform inspired by Letterboxd. Discover, rate, and review books with a sleek, dark-themed interface.

## 🏗️ Architecture Overview

This is a full-stack web application with a clear separation of concerns:

### Backend (Django REST API)
- **Framework**: Django 5.2 with Django REST Framework
- **Authentication**: JWT (JSON Web Tokens) via `djangorestframework-simplejwt`
- **Database**: SQLite (easily switchable to PostgreSQL/MySQL for production)
- **CORS**: Enabled for frontend communication
- **Key Features**:
  - User registration and authentication
  - Book and author management
  - Review and rating system
  - Reading diary functionality
  - API endpoints for CRUD operations

### Frontend (React SPA)
- **Framework**: React 18 with React Router
- **Styling**: Bootstrap + Custom CSS (dark theme)
- **HTTP Client**: Axios for API calls
- **State Management**: React Context for authentication
- **Key Features**:
  - Responsive book grid with hover popups
  - Search and pagination
  - User reviews and ratings
  - Reading diary management
  - Authentication forms

### Data Flow
1. Frontend makes API requests to backend endpoints
2. Backend processes requests, interacts with database
3. Responses sent back to frontend for rendering
4. JWT tokens handle user sessions

## 🛠️ Tech Stack

- **Backend**: Python, Django, Django REST Framework, SQLite
- **Frontend**: JavaScript, React, Bootstrap, Axios
- **Deployment**: Heroku (backend), Vercel/Netlify (frontend)
- **Version Control**: Git
- **Environment**: Python virtualenv, Node.js

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- Git
- GitHub account (for deployment)

## 🚀 Local Development Setup

### Backend Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/letterbooked.git
   cd letterbooked/backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install django-environ  # For environment variables
   ```

4. **Set up environment variables**:
   - Copy `backend/.env.example` to `backend/.env` (if provided) or create it:
     ```
     SECRET_KEY=your-secret-key-here
     DEBUG=True
     ALLOWED_HOSTS=localhost,127.0.0.1
     DATABASE_URL=sqlite:///db.sqlite3
     CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
     ```
   - Generate a secure SECRET_KEY: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

5. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Populate database (optional)**:
   ```bash
   python manage.py populate_db
   python manage.py populate_from_api
   ```

7. **Start the server**:
   ```bash
   python manage.py runserver
   ```
   Backend will run on `http://127.0.0.1:8000`

### Frontend Setup
1. **Navigate to frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create `frontend/.env`:
     ```
     REACT_APP_API_BASE_URL=http://127.0.0.1:8000
     ```

4. **Start the development server**:
   ```bash
   npm start
   ```
   Frontend will run on `http://localhost:3000`

### Running Both Together
- Open two terminals: one for backend, one for frontend.
- Ensure CORS is configured correctly in backend settings.

## 🌐 Deployment

### Backend Deployment (Heroku)
1. **Install Heroku CLI** and log in:
   ```bash
   heroku login
   ```

2. **Create Heroku app**:
   ```bash
   cd backend
   heroku create your-app-name
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set SECRET_KEY=your-production-secret-key
   heroku config:set DEBUG=False
   heroku config:set ALLOWED_HOSTS=your-app-name.herokuapp.com
   heroku config:set DATABASE_URL=your-database-url  # For production DB
   heroku config:set CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   heroku run python manage.py migrate
   ```

5. **Access your API** at `https://your-app-name.herokuapp.com`

### Frontend Deployment (Vercel)
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `REACT_APP_API_BASE_URL=https://your-backend-url.herokuapp.com`

4. **Redeploy** after changes.

### Alternative Frontend Deployment (Netlify)
- Drag & drop the `frontend/build` folder after `npm run build`.
- Set environment variables in Netlify dashboard.

## 📡 API Endpoints

### Authentication
- `POST /api/token/` - Login
- `POST /api/register/` - Register

### Books
- `GET /api/books/` - List books
- `POST /api/books/` - Add book
- `GET /api/books/{id}/` - Book details

### Reviews
- `GET /api/reviews/` - List reviews
- `POST /api/reviews/` - Add review
- `PATCH /api/reviews/{id}/` - Update review

### Authors
- `GET /api/authors/` - List authors
- `POST /api/authors/` - Add author

### Diary
- `GET /api/diary-entries/` - List diary entries
- `POST /api/diary-entries/` - Add/update diary entry

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you have questions or issues, open an issue on GitHub or contact the maintainers.