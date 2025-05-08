# 🧮 Roomify – TFSA Calculator App

A sleek, full-stack TFSA tracking app built and shipped in under **24 hours**.

Track your tax-free savings.

---

## 🚀 Project Overview

**Roomify** is a MERN-stack web application that allows Canadian users to create an account, calculate their total TFSA contribution room, and manage their deposits and withdrawals. Built for simplicity, security, and speed, this app gives users full control over their TFSA tracking  all in a modern, dark-themed interface.

---

## 🛠 Tech Stack

- **MongoDB** – NoSQL database to store user and TFSA data
- **Express.js** – API routes and business logic
- **Next.js** (React.js Framework) – Modern frontend with a fast dev environment
- **Node.js** – Backend server
- **Tailwind CSS** – Utility-first CSS for sleek, responsive UI
- **JWT** – Secure user authentication using tokenization

---

## 🔐 Core Features

### ✅ User Authentication
- Register/login using **email**, **password**, and **year you turned 18**
- JWT-based session handling
- Passwords securely **hashed** before storage

### 📊 Dashboard Overview
- **Total Contribution Room**
- **Total Deposits**
- **Total Withdrawals**
- **Remaining Room**

Styled with **responsive, Twitter-like cards** in a modern dark UI.

### 💸 Transaction Management
- Add **Deposits** (subtract from contribution room)
- Add **Withdrawals** (add back to contribution room)
- View full **transaction history**

### 🧠 TFSA Logic Engine
- Uses a static lookup table for TFSA limits (from 2009 onward)
- Calculates contribution room based on user's **age/year turned 18**
- Handles CRA-like rules (no sync, simplified)

---

## 💻 Frontend UX/UI

- Built using **React + Vite**
- Inspired by **Twitter’s dark theme**
- Smooth interactions with:
  - Soft borders
  - Subtle hover effects
  - Rounded buttons and inputs
- Uses **modals** for transaction forms
- Fully **responsive** for desktop and mobile

---

## 🧮 Example Logic

If a user turned 18 in **2018**, the app adds up TFSA limits from **2018 to 2025**, and subtracts any deposits.

Withdrawals are added back to room the **following calendar year** (manual simulation, not CRA-linked).

---

## 📂 Project Structure

TFSA-Calculator/
├── frontend/   # React + Vite + Tailwind
└── backend/    # Node + Express + MongoDB

🚀 Fully functional in under **24 hours** 

## 📬 Contact

Built by [@michaelmarsillo](https://github.com/michaelmarsillo)  
DM for feedback, collaboration, or if you maxed out your TFSA 😅