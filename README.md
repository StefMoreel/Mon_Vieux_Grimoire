# 📚 Mon Vieux Grimoire

Projet de site de référencement et de notation de livres.  
Développé dans le cadre de la formation **OpenClassrooms - Développeur Web**.

---

## 🚀 Stack technique
- **Backend** : Node.js + Express
- **Base de données** : MongoDB Atlas (Mongoose ODM)
- **Frontend** : React
- **Sécurité** :
  - Hash des mots de passe avec bcrypt
  - Authentification par JWT
  - Middleware d’autorisation sur les routes sensibles
- **Gestion des images** :
  - Upload avec Multer
  - Optimisation et redimensionnement avec Sharp

---

## 📂 Structure du projet
```
backend/
 ├─ controllers/ (user.js, book.js)
 ├─ middleware/ (auth.js, multer-config.js, sharp-config.js)
 ├─ models/ (User.js, Book.js)
 ├─ routes/ (user.js, book.js)
 ├─ images/ (stockage des couvertures optimisées)
 ├─ app.js
 └─ server.js

frontend/
 ├─ src/
 └─ ...
```

---

## ⚙️ Installation

### 1. Cloner le repo
```bash
git clone https://github.com/<ton-user>/<ton-repo>.git
cd mon-vieux-grimoire
```

### 2. Installer les dépendances
- **Backend**
```bash
cd backend
npm install
```
- **Frontend**
```bash
cd frontend
npm install
```

### 3. Variables d’environnement
Créer un fichier `.env` à la racine du backend avec :
```env
MONGO_URI=<url de connexion MongoDB Atlas>
JWT_SECRET=<ta_clé_secrète_jwt>
PORT=4000
```

---

## ▶️ Lancer le projet

### Backend
```bash
cd backend
npm run start
```
ou en mode développement avec Nodemon :
```bash
npm run dev
```

### Frontend
```bash
cd frontend
npm start
```

---

## 🔑 Routes principales (API)

### Authentification
- `POST /api/auth/signup` → inscription
- `POST /api/auth/login` → connexion

### Livres
- `GET /api/books` → récupérer tous les livres
- `GET /api/books/:id` → récupérer un livre
- `POST /api/books` → ajouter un livre (auth + upload image)
- `PUT /api/books/:id` → modifier un livre (auth + upload image)
- `DELETE /api/books/:id` → supprimer un livre (auth)
- `POST /api/books/:id/rating` → ajouter une note

---

## ✨ Fonctionnalités
- Authentification sécurisée
- Ajout et modification de livres avec upload d’image
- Notation unique par utilisateur
- Calcul automatique de la moyenne des notes (arrondie à 2 décimales)
- Classement des meilleurs livres

---

## 👤 Auteur
Projet réalisé par **[Ton Nom]** – développeur backend.  
Partenariat avec un développeur frontend pour l’intégration React.
