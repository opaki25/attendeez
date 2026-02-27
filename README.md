# Attendly

Attendly is a simple event RSVP and attendance management system built with Flask. It allows attendees to browse events, confirm attendance, and organizers to manage events and view attendee lists.

## Features

- Browse events with cards showing poster, name, date/time, and location.
- RSVP flow for new and returning attendees.
- Organizer login (static credentials) to create events and view attendees.
- Export attendee lists as CSV.
- Responsive design using Bootstrap.

## Setup

1. Create a virtual environment and activate it (already done if using provided `.venv`).
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the app:
   ```bash
   python app.py
   ```
4. Access the site at `http://127.0.0.1:5000/`.

Organizer credentials default to `admin/password`, configurable via environment variables `ORG_USER` and `ORG_PASS`.

## Database

Using SQLite stored in `attendly.db`. The database is auto-created on startup.

## Sample Data

To populate demo events and a sample attendee, run:

```bash
python sample_data.py
```

This will recreate the database and insert a few example events.

## Frontend (React)

A modern SPA is located in the `frontend/` directory.

To run it for development, start both the Flask API and the Vite frontend in separate terminals.

**Terminal 1 – backend:**

```bash
cd c:\Users\OPAKI\Desktop\Attendly
python app.py          # runs on http://127.0.0.1:5000
```

**Terminal 2 – frontend:**

```bash
cd c:\Users\OPAKI\Desktop\Attendly\frontend
npm install            # install dependencies once
npm run dev            # start Vite dev server (default port 3000, may bump to 3001+ if in use)
```

After startup you’ll see a message like “Local: http://localhost:3000” (or 3001, 3002, etc. if 3000 is busy).  Open that URL in a browser to view the React UI; it transparently proxies any `/api` or `/search_attendee` calls to the backend and provides full end-to-end functionality with the custom event detail and RSVP pages.

Build a production bundle with:

```bash
npm run build
```

and serve the static files with any HTTP server, or integrate with Flask if desired.

## Email confirmations

If you want attendees to receive confirmation emails, set these environment variables (example in `.env`):

```
SMTP_HOST=smtp.mailprovider.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=yourpassword
```

When SMTP is configured, the app will send a basic text confirmation email after RSVP.

## Deployment

### Backend (Heroku)

1. Create a Heroku app:
   ```bash
   heroku create attendly-backend
   ```
2. Add required config vars:
   ```bash
   heroku config:set SECRET_KEY="$(openssl rand -hex 16)"
   heroku config:set ORG_USER=admin ORG_PASS=password
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```
4. Ensure a Procfile exists with:
   ```text
   web: gunicorn app:app
   ```

### Frontend (Vercel or Netlify)

- Deploy the `frontend/` folder. Configure the build command `npm run build` and the output directory `dist`.
- Set the production environment variable `VITE_API_URL` to your backend's URL if you modify the code to use it.

Alternatively, you can serve the built frontend from the Flask server by copying `frontend/dist` into `static`.

### Fly.io

You can also deploy both services with Fly using separate apps or a single multi-service config. A simple `fly.toml` can point the frontend to be served by a static server and the backend by the Flask process.


Feel free to choose the platform you prefer; the backend is standard Python/Flask and the frontend is any static hosting solution.

## Notes

This is a prototype and lacks advanced security, email notifications, and comprehensive filtering. Use as a starting point for further development.
