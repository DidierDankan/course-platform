# 🎓 Course Platform

A full-stack course subscription platform built with **React**, **Node.js**, and **MySQL**, supporting **user roles**, **authentication**, and **course management**. Designed to showcase practical web development skills in a real-world, scalable structure.

---

## ⚙️ Tech Stack

### 🖥️ Frontend
- [React](https://reactjs.org/) (with Vite)
- [Tailwind CSS](https://tailwindcss.com/)
- React Router (for navigation)
- React Query or Redux (TBD)

### 🔧 Backend
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- [JWT](https://jwt.io/) for authentication
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing
- `dotenv`, `cors`

---

## ✨ Features

- 🔐 **User Authentication** (register & login with hashed passwords)
- 👥 **Role-Based Access Control** (`admin`, `seller`, `user`)
- 🎓 **Course Management**
  - Sellers can create/update/delete their own courses
  - Users can browse and enroll in courses
- 🛠️ **Express REST API**
- 🧪 Ready for **Stripe** or payment integration
- 📦 Modular backend folder structure (`routes`, `controllers`, `middleware`)

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/DidierDankan/course-platform.git
cd course-platform
