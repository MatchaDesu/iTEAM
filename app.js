
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public
app.use(express.static(path.join(__dirname, 'public')));

// Landing Page
app.get('/', (req, res) => {
    res.send('Welcome to iTEAM!');
});

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/user.routes'));
app.use('/teams', require('./routes/team.routes'));
app.use('/application', require('./routes/application.routes'));
app.use('/admin', require('./routes/admin.routes'));

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});