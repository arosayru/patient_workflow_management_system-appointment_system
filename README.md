<h1>Patient Workflow Management System </h1>
This repository contains a full‑stack web application for managing hospital appointments. Patients can browse doctors, book appointments and view their medical history. Doctors can manage their schedules, view appointments and record medical data for their patients. Administrators oversee doctor profiles, patient records and simple analytics. The project is intentionally lightweight and easy to extend.

<h2>Tech Stack</h2>
<b>Frontend:</b>	Next.js, React <br/>
<b>Backend:</b>	Node.js, Express<br/>
<b>Database:</b>	PostgreSQL<br/>
<b>Auth:</b>	JSON Web Tokens (JWT)

<h2>Features</h2>
<h3>Patient</h3>
•	Register and log in securely using JWT.<br/>
•	Browse available doctors filtered by specialty, location and date.<br/>
•	View detailed doctor profiles with biographies and available appointment slots.<br/>
•	Book appointments and see a list of past and upcoming appointments.<br/>
•	View medical records recorded by doctors.<br/>

<h3>Doctor</h3>
•	Log in and view appointments scheduled with them.<br/>
•	Update appointment status (pending, confirmed, completed or cancelled) and notes.<br/>
•	Manage their own availability by adding or removing schedule slots.<br/>
•	Record diagnosis, prescriptions and attachments for each patient appointment.<br/>
•	View medical records for patients they have treated.<br/>

<h3>Admin</h3>
•	Manage doctor accounts: create, update and delete doctors along with their underlying user accounts.<br/>
•	View all appointments and update their status or notes.<br/>
•	Access simple analytics: patient counts and appointment numbers per doctor.<br/>

<h2>Getting Started</h2>
The application is split into a backend API and a frontend client. Follow these steps to run the system locally. These instructions assume you have Node.js and PostgreSQL installed.

<h3>1. Database Setup</h3>
1.	Create a PostgreSQL database named appointment_system (or modify the DATABASE_URL in backend/.env).<br/>
2.	Update the DATABASE_URL and JWT_SECRET in backend/.env to match your environment. The example uses:<br/>

```
DATABASE_URL=postgresql://username:password@localhost:5432/appointment_system
JWT_SECRET=your_jwt_secret_here
PORT=4000
```

1.	When the backend starts for the first time it will automatically create the necessary tables if they do not exist.

<h3>2. Backend</h3>
Navigate to the backend folder, install dependencies and start the API server:

```
cd backend
npm install
npm run start
```
The API will listen on http://localhost:4000 by default. See backend/server.js for route definitions.

<h3>3. Frontend</h3>
Navigate to the frontend folder, install dependencies and start the development server:

```
cd frontend
npm install
npm run dev
```
By default the Next.js dev server runs on http://localhost:3000. It proxies API requests to the backend through the BASE_URL defined in frontend/utils/api.js. If your backend runs on a different host or port, set the environment variable NEXT_PUBLIC_BACKEND_URL before starting the frontend:

```
export NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
npm run dev
```
### 4. Creating an Admin User

Only patients can self‑register through the web interface.  Doctor and admin accounts must be created manually.  To log in as an administrator you will need to insert an admin user directly into the database.  Follow these steps:

1. **Generate a bcrypt password hash**.  Open a terminal in the `backend` directory (where `bcryptjs` is installed) and run the following Node command, substituting your desired admin password in place of `MySecretPassword`:

   ```bash
   cd backend
   node -e "require('bcryptjs').hash('MySecretPassword', 10).then(h => console.log(h))"
   ```

   Copy the resulting hash; it will look something like `$2a$10$H2b1Lq8CEEg/6bWQ3sDfQeZ1k8fx6nQkYi3jR6pFM2eICfFCn0xZS`.

2. **Insert the admin user into your PostgreSQL database.**  Connect to the `appointment_system` database using `psql`, pgAdmin or another client and run:

   ```sql
   INSERT INTO users (name, email, password_hash, role)
   VALUES ('Admin User', 'admin@example.com', '<copied_hash>', 'admin');
   ```

   Replace `<copied_hash>` with the bcrypt hash from step 1.  This creates an admin account with email `admin@example.com` and the plaintext password you selected.  You can now log in through `/login` using these credentials.

To create doctor accounts, log in as the admin user and navigate to **Manage Doctors** in the dashboard.  From there you can add new doctors by specifying their name, email, password, specialty and other details.  Doctors will then be able to log in using the shared login form.

### 5. API Testing with Postman

For convenience this repository includes a Postman collection (`postman_collection.json`) that documents all available endpoints.  To use it:

1. Open Postman and choose **Import**.  Select the `postman_collection.json` file from the root of this project.

2. Set the `baseUrl` environment variable to your backend URL, e.g. `http://localhost:4000`.

3. After logging in through the API or web interface, copy the returned JWT into the `token` environment variable.  Requests that require authentication include `{{token}}` in the `Authorization` header.

The collection covers authentication, doctor management, schedule management, appointment booking and updating, medical record operations, and analytics.  You can use it as a reference or to manually exercise the API while developing new features.

<h2>Notes</h2>
•	The application uses JSON Web Tokens (JWT) for stateless authentication. Tokens expire after 24 hours; modify the expiry in backend/routes/auth.js if necessary.<br/>
•	Passwords are hashed using bcrypt before storage. Change the salt rounds in the same file for stronger hashing.<br/>
•	The optional features such as real‑time slot availability via WebSockets, charts and notifications have been left out to keep the code concise. Hooks exist in the API to support these extensions (for example, the schedule routes and analytics endpoint).<br/>
•	For security in production, set JWT_SECRET to a strong secret, use HTTPS and configure appropriate CORS rules.

<h2>License</h2>
This project is provided as‑is without warranty. You are free to modify and extend it for your own use.
________________________________________
