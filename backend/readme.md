# Letterbooked Backend

A Django REST API backend for Letterbooked, a social book review platform inspired by Letterboxd. Users can review books, create lists, follow others, and manage content based on roles (Admin, Verified Author, User).

## Features
- User authentication with JWT tokens
- Role-based permissions: Admins manage authors/publishers, Verified Authors add books, Users review and list
- CRUD operations for books, authors, reviews, lists, follows, tags, and activities
- CORS enabled for React frontend integration
- PostgreSQL/SQLite database support

## Installation
1. Clone the repository and navigate to the backend directory:

cd /Users/williamomeara/Projects/letterbooked/backend

2. Create a virtual environment:


generate an md file for me based on the current backend

cd /Users/williamomeara/Projects/letterbooked/backend

python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate

3. Install dependencies:

pip install -r requirements.txt

(Ensure `requirements.txt` includes: `django`, `djangorestframework`, `djangorestframework-simplejwt`, `django-cors-headers`)

4. Apply migrations:

python manage.py makemigrations
python manage.py migrate

5. Create a superuser:

python manage.py createsuperuser

6. Run the server:

python manage.py runserver

Access at `http://127.0.0.1:8000/`.

## Configuration
- **Settings**: Update `backend/settings.py` for production (e.g., `DEBUG=False`, add `ALLOWED_HOSTS`, configure database).
- **CORS**: Origins allowed in `CORS_ALLOWED_ORIGINS` (e.g., `['http://localhost:3000']` for React).
- **JWT**: Configured via `rest_framework_simplejwt` for token auth.

## Models
- **User**: Django's built-in user model, extended with Profile.
- **Profile**: Role-based (admin/author/user), verification for authors.
- **Author**: Name, bio, birth/death dates.
- **Publisher**: Name, website.
- **Book**: Title, authors (many-to-many), publisher, ISBN, genre, description, cover, page count.
- **Review**: User, book, rating (1-5), text, timestamp.
- **List**: User-curated book lists.
- **Follow**: User follows another user.
- **Tag**: Generic tags.
- **BookTag**: Tags for books.
- **ReviewTag**: Tags for reviews.
- **Activity**: User activity feed.

## API Endpoints
Base URL: `http://127.0.0.1:8000/api/`

### Authentication
- `POST /register/`: Register a new user.
- `POST /token/`: Obtain JWT access/refresh tokens.
- `POST /token/refresh/`: Refresh access token.

### Resources (All support GET, POST, PUT, DELETE with permissions)
- `/authors/`: Authors (Admin only for create/update).
- `/publishers/`: Publishers (Admin only).
- `/books/`: Books (Admin/Verified Author for create/update).
- `/reviews/`: Reviews (Authenticated users).
- `/lists/`: User lists (Authenticated users).
- `/follows/`: Follows (Authenticated users).
- `/tags/`: Tags (Authenticated users).
- `/booktags/`: Book tags (Authenticated users).
- `/reviewtags/`: Review tags (Authenticated users).
- `/activities/`: Activities (Authenticated users).

Use `Authorization: Bearer <token>` for authenticated requests. Test with Postman using the provided collection.

## Permissions
- **Unauthenticated**: Read-only access to public data.
- **User**: Review, list, follow, tag.
- **Verified Author**: Add/edit books.
- **Admin**: Full access, including authors/publishers.

## Testing
- Use Postman collection (`letterbooked.postman_collection.json`) for API testing.
- Create test users via shell or admin panel.
- Run `python manage.py test` for unit tests (add tests to `api/tests.py`).

## Deployment
- Use Gunicorn/Django for production.
- Configure environment variables for secrets.
- Set up a production database (e.g., PostgreSQL).

## Contributing
- Follow Django best practices.
- Add migrations for model changes.
- Document API changes in this README.

For frontend integration, see the React app documentation.