# CodeCraftHub — Full-Stack Learning Dashboard

A lightweight full-stack web application designed for tracking course learning progress. Built with a Flask RESTful API backend and a responsive Vanilla JS frontend.

## 🚀 Features

* **Full CRUD Operations**: Create, read, update, and delete courses in real-time.
* **Dynamic Analytics**: Visual summary metrics showing total, in-progress, and completed courses.
* **RESTful API**: Clean REST endpoint architecture powered by Flask.
* **Local Data Persistence**: Persistent storage using local JSON files.
* **Zero Heavy Frameworks**: Pure Native JavaScript and CSS with no heavy build setup required.

## 🛠️ Tech Stack

* **Frontend**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3
* **Backend**: Python 3, Flask, Flask-CORS
* **Storage**: JSON File Storage

## 📁 Project Structure

```text
CodeCraftHub/
├── app.py          # Flask REST API server
├── courses.json    # JSON database file
├── index.html      # Single Page Application entry
├── main.js         # Frontend logic & API interaction
├── style.css       # Custom dark theme styles
└── README.md       # Project documentation

💻 How to Run Locally
1. Start the Backend API Server
pip install flask flask-cors
python app.py

2. Launch the Frontend
Run Python's built-in HTTP server on port 5500:
python -m http.server 5500
Then visit http://127.0.0.1:5500 in your browser.