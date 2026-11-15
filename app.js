require('dotenv').config();

const express = require('express');
const path = require('path');
const { sessionMiddleware } = require('./config/session');

const app = express();
const PORT = process.env.PORT || 3000;

// ถ้าอยู่หลัง proxy (เช่น Nginx, Render) cookie แบบ secure ถึงจะทำงาน
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(sessionMiddleware);

// Landing Page
app.get('/', (req, res) => {
    res.send('Welcome to iTEAM!');
});

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/user.routes'));
app.use('/teams', require('./routes/team.routes'));
app.use('/categories', require('./routes/category.routes'));
app.use('/application', require('./routes/application.routes'));
app.use('/admin', require('./routes/admin.routes'));

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});