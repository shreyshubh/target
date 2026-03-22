# CS Master Syllabus — MERN Stack

A full-stack web app built with **MongoDB, Express, React, and Node.js** that lets you track your CS preparation progress across DSA, Core CS, System Design, AI/ML/DL, Projects & Research, and GRE/TOEFL.

Progress is **automatically saved** to the cloud database and restored every time you open the app.

---

## 📁 Project Structure

```
syllabus/
├── src/                   ← Express backend
│   ├── models/
│   │   └── Progress.model.js
│   ├── routes/
│   │   └── progress.routes.js
│   └── server.js
├── frontend/              ← React + Vite frontend
│   ├── src/
│   │   ├── components/    ← Header, Tabs, TrackPanel, TopicRow
│   │   ├── data/
│   │   │   └── tracks.js  ← All syllabus data
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── index.css
│   ├── index.html
│   └── vite.config.js
├── package.json           ← Backend package
├── .env.example
└── .gitignore
```

---

## 🍃 Step 1 — Set Up MongoDB Atlas (Free)

MongoDB Atlas is a free cloud database. Follow these steps exactly:

### 1.1 Create an Account
1. Go to **[https://cloud.mongodb.com](https://cloud.mongodb.com)**
2. Click **"Try Free"** → Sign up with Google or email
3. After signing up, you'll be taken to your Dashboard

### 1.2 Create a Free Cluster
1. Click **"Build a Database"**
2. Choose **"M0 FREE"** (Shared, free tier) — make sure it says $0/month
3. Choose a cloud provider (AWS recommended) and region closest to you (e.g., Mumbai / Singapore)
4. Name your cluster anything, e.g. `Cluster0`
5. Click **"Create Deployment"**

### 1.3 Create a Database User
When prompted (or via **Database Access** in the left sidebar):
1. Click **"Add New Database User"**
2. **Authentication Method**: Password
3. Enter a **username** (e.g., `syllabususer`) and a **strong password** — **save this password**, you'll need it
4. Under "Built-in Role", choose **"Read and write to any database"**
5. Click **"Add User"**

### 1.4 Whitelist Your IP Address
1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For local development: click **"Add Current IP Address"**
4. For Render deployment: click **"Allow Access from Anywhere"** (sets `0.0.0.0/0`) → confirm
5. Click **"Confirm"**

### 1.5 Get Your Connection String
1. In the left sidebar, click **"Database"** (under Deployment)
2. Click **"Connect"** next to your cluster
3. Choose **"Drivers"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string — it looks like:
   ```
   mongodb+srv://syllabususer:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add the database name before `?`:
   ```
   mongodb+srv://syllabususer:YOURPASSWORD@cluster0.xxxxx.mongodb.net/syllabus?retryWrites=true&w=majority
   ```

---

## 💻 Step 2 — Run Locally

### 2.1 Configure the Backend
1. Copy the `.env.example` file and name it `.env`:
   ```bash
   copy .env.example .env
   ```
2. Open `.env` and paste your MongoDB connection string:
   ```
   MONGO_URI=mongodb+srv://syllabususer:YOURPASSWORD@cluster0.xxxxx.mongodb.net/syllabus?retryWrites=true&w=majority
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

### 2.2 Start the Backend
From the root folder (`syllabus/`):
```bash
npm start
```
You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

### 2.3 Start the Frontend
Open a **second terminal**, navigate to the `frontend/` folder:
```bash
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🚀 Step 3 — Deploy to the Internet (Free, using Render)

### 3.1 Push to GitHub
1. Create a new repo on [github.com](https://github.com) (e.g. `cs-master-syllabus`)
2. From your `syllabus/` folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial MERN commit"
   git remote add origin https://github.com/YOUR_USERNAME/cs-master-syllabus.git
   git push -u origin main
   ```

### 3.2 Deploy the Backend on Render
1. Go to **[https://render.com](https://render.com)** → Sign up / Log in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Settings:
   | Setting | Value |
   |---------|-------|
   | **Name** | `cs-syllabus-backend` |
   | **Root Directory** | *(leave empty — root of repo)* |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
5. Click **"Add Environment Variable"** and add:
   - `MONGO_URI` → your full MongoDB connection string
   - `CLIENT_URL` → *(leave blank for now, update after frontend deploy)*
6. Click **"Create Web Service"**
7. Wait ~2 minutes. You'll get a URL like `https://cs-syllabus-backend.onrender.com` — **save this**

### 3.3 Deploy the Frontend on Render
1. In the `frontend/` folder, create a `.env.production` file:
   ```
   VITE_API_URL=https://cs-syllabus-backend.onrender.com/api
   ```
2. Commit and push this file to GitHub
3. On Render, click **"New +"** → **"Static Site"**
4. Connect your same GitHub repo
5. Settings:
   | Setting | Value |
   |---------|-------|
   | **Name** | `cs-syllabus-frontend` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |
6. Click **"Create Static Site"**
7. You'll get a URL like `https://cs-syllabus-frontend.onrender.com` — **this is your live app!**

### 3.4 Update CORS (Final Step)
1. Go back to your **backend** service on Render → **Environment** tab
2. Update `CLIENT_URL` to your frontend URL (e.g., `https://cs-syllabus-frontend.onrender.com`)
3. Render will auto-redeploy

---

## 🌐 Your Live App

Once deployed:
- Open your frontend Render URL
- Check topics — they save automatically to MongoDB
- Refresh the page — **your progress is restored** ✅

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | CSS Modules + CSS Variables |
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Deployment | Render (free tier) |

---

## 🔑 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/progress/guest` | Fetch all saved progress |
| `POST` | `/api/progress/guest` | Save/update progress |
| `GET` | `/health` | Backend health check |
