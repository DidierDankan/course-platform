# 🎓 Lumen

A **full-stack video-course marketplace** built with **React (Vite)**, **Node.js**, and **MySQL** — featuring authentication, profile management, role-based dashboards, and course management. Designed as a scalable real-world app structure, perfect for learning and extending.

---

## ⚙️ Tech Stack

### 🖥️ Frontend

- ⚡ **React (Vite)** – Fast development & build  
- 🎨 **Tailwind CSS** – Utility-first, responsive design  
- 🧭 **React Router v6** – Protected routes & role-based navigation  
- 📡 **Redux Toolkit + RTK Query** – State management & data fetching  
- ✅ **Formik + Yup** – Form handling & validation  

### 🔧 Backend

- 🚀 **Node.js + Express** – REST API with modular routes/controllers  
- 🗄️ **MySQL** – Relational database for users, profiles, courses, etc.  
- 🔐 **JWT Authentication** – Secure login & role-based access control  
- 🔑 **bcrypt** – Password hashing  
- 📂 **Multer** – Profile image upload handling  
- 🌱 **dotenv** – Environment-based configuration  

---

## ✨ Features

- 🔐 **Authentication & Authorization**  
  - Secure registration & login  
  - Role-based access (`admin`, `seller`, `user`)  

- 🧑‍💻 **User Profiles**  
  - Editable profiles with **image upload**  
  - Skills (tags) & qualifications (structured data)  

- 🎓 **Course Management**  
  - Sellers can create, update, delete courses  
  - Users can browse & enroll  

- 📊 **Dashboard Views**  
  - Personalized pages per role  

- 🖼️ **Static File Serving**  
  - User-uploaded profile images served from `/uploads`  

---

## 📂 Project Structure

```plaintext
course-platform/
├── client/ (React + Vite frontend)
│   ├── src/
│   │   ├── api/            # RTK Query API slices
│   │   ├── components/     # Reusable UI components (Header, Layout, etc.)
│   │   ├── pages/          # Route-level views (Login, Register, Profile, etc.)
│   │   ├── utils/          # Form validation, handlers, helpers
│   │   └── main.jsx
│   └── vite.config.js
└── server/ (Node.js + Express backend)
    ├── controllers/        # Request handlers
    ├── middleware/         # Auth middleware, error handlers
    ├── routes/             # API endpoints
    ├── services/           # Database queries
    ├── uploads/            # Profile images (static)
    └── server.js
```

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/DidierDankan/course-platform.git
cd course-platform
```

---

### 2️⃣ Configure the Database

Create an empty database called `course_platform` (or the name you set in `.env`) in phpMyAdmin or any MySQL client. Don't create tables by hand: `npm run migrate` builds them in step 5.

---

### 3️⃣ Install Dependencies
#### Backend:
```bash
cd server
npm install
```

### Frontend:
```bash
cd ../client
npm install
```

---

### 4️⃣ Configure Environment Variables

Create .env files in both server/ and client/ directories.

**server/.env**
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=course_platform
JWT_SECRET=supersecretkey
```

**client/.env**
```env
VITE_API_URL=http://localhost:3001
```

---

### 5️⃣ Run the App
**Backend (Express):**
```bash
cd server
npm run migrate   # creates or updates the tables; safe to run every time
npm run dev
```

**Frontend (React + Vite):**
```bash
cd client
npm run dev
```

Then visit: **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Development Notes

Profile images are stored in `/server/uploads/` and served at `/uploads/filename.png`

Skills & qualifications are stored in normalized tables (1 row per skill/qualification)

Uses unique constraints to prevent duplicates (e.g. same skill twice for one user)

---

## 📚 Future Improvements

### ✅ Integrate Stripe or other payment processor

### 📢 Add real-time notifications (Socket.io)

### 🏆 Add course progress tracking & certificates

### 🌐 Deploy to production (Render, Railway, or Vercel)

### 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

## 📜 License

MIT © 2025 — Created by Didier Dankan