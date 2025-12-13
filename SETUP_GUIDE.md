# IntroBook Project Setup Guide

## Project Overview
IntroBook is a full-stack web application with:
- **Frontend**: React.js application
- **Backend**: Django REST API
- **Database**: PostgreSQL

## Prerequisites
Before setting up the project, ensure you have the following installed:

### Required Software
1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **Python** (v3.8 or higher) - [Download](https://python.org/)
3. **PostgreSQL** (v12 or higher) - [Download](https://postgresql.org/)
4. **Git** - [Download](https://git-scm.com/)

## PostgreSQL Setup

### 1. Download and Install PostgreSQL
- Download PostgreSQL from: https://www.postgresql.org/download/
- During installation, remember the password you set for the `postgres` user
- Default port is usually 5432, but this project uses 5433

### 2. Create Database
After installation, open pgAdmin or use command line:

```sql
-- Connect to PostgreSQL as postgres user
-- Create the database
CREATE DATABASE introobook_db;

-- Create a user (optional, or use postgres user)
CREATE USER introbook_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE introobook_db TO introbook_user;
```

### 3. Configure PostgreSQL Connection
The project is configured to connect to:
- **Database Name**: `introobook_db`
- **User**: `postgres`
- **Password**: `Dharmik2107` (you need to change this)
- **Host**: `localhost`
- **Port**: `5433`

## Project Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd introo/introobook
```

### 2. Backend Setup (Django)

#### Navigate to backend directory
```bash
cd introbook_backend
```

#### Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Required Python Packages
The `requirements.txt` includes:
- Django==5.2.4
- djangorestframework
- django-cors-headers
- psycopg2-binary (PostgreSQL adapter)
- pandas (for Excel processing)
- openpyxl (for Excel file handling)

#### Configure Database Settings
Edit `introbook_backend/settings.py` and update the database configuration:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'introobook_db',
        'USER': 'postgres',          # Your PostgreSQL username
        'PASSWORD': 'YOUR_PASSWORD', # Your PostgreSQL password
        'HOST': 'localhost',
        'PORT': '5432',             # Default PostgreSQL port (change if different)
    }
}
```

#### Run Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

#### Start Django Development Server
```bash
python manage.py runserver
```
The backend will run on: http://localhost:8000

### 3. Frontend Setup (React)

#### Navigate to frontend directory (from project root)
```bash
cd introobook  # If you're in introbook_backend, go back: cd ..
```

#### Install Node.js Dependencies
```bash
npm install
```

#### Required Node.js Packages
The `package.json` includes:
- React 19.1.0
- React Router DOM
- Axios (for API calls)
- Various UI and utility libraries

#### Start React Development Server
```bash
npm start
```
The frontend will run on: http://localhost:3000

## Important Configuration Changes

### 1. Database Configuration
**CRITICAL**: Update the database credentials in `introbook_backend/introbook_backend/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'introobook_db',
        'USER': 'your_postgres_username',
        'PASSWORD': 'your_postgres_password',
        'HOST': 'localhost',
        'PORT': '5432',  # Change to your PostgreSQL port
    }
}
```

### 2. Security Settings
**IMPORTANT**: For production deployment:

1. Change the SECRET_KEY in `settings.py`
2. Set `DEBUG = False`
3. Update `ALLOWED_HOSTS` with your domain
4. Configure proper email settings for production

### 3. CORS Configuration
The project is configured to allow requests from `http://localhost:3000`. If you change the frontend port, update `CORS_ALLOWED_ORIGINS` in `settings.py`.

## Running the Complete Application

### 1. Start PostgreSQL Service
Ensure PostgreSQL is running on your system.

### 2. Start Backend Server
```bash
cd introbook_backend
# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

python manage.py runserver
```

### 3. Start Frontend Server (in new terminal)
```bash
cd introobook
npm start
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin

## Troubleshooting

### Common Issues

1. **PostgreSQL Connection Error**
   - Verify PostgreSQL is running
   - Check database name, username, password, and port
   - Ensure the database exists

2. **Python Package Installation Issues**
   - Make sure you're in the virtual environment
   - Try upgrading pip: `pip install --upgrade pip`
   - For psycopg2 issues on Windows, try: `pip install psycopg2-binary`

3. **Node.js Dependency Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again
   - Ensure Node.js version is compatible

4. **Migration Issues**
   - Delete migration files (keep `__init__.py`)
   - Run `python manage.py makemigrations`
   - Run `python manage.py migrate`

### Port Conflicts
If default ports are occupied:
- Backend: Change port with `python manage.py runserver 8001`
- Frontend: Set `PORT=3001` environment variable or modify in package.json

## Additional Notes

### File Upload Feature
The project includes Excel file upload functionality for bulk data import. Ensure the `media/` directory has proper write permissions.

### API Endpoints
The Django backend provides REST API endpoints. Check `acc_intro/urls.py` for available endpoints.

### Development vs Production
This setup is for development. For production deployment:
- Use a production-grade database setup
- Configure proper static file serving
- Set up environment variables for sensitive data
- Use a production WSGI server like Gunicorn
- Configure reverse proxy (Nginx/Apache)

## Support
If you encounter issues during setup, check:
1. All prerequisites are installed correctly
2. Database connection parameters are correct
3. Virtual environment is activated for Python dependencies
4. All required ports are available

For specific errors, check the console output for detailed error messages.