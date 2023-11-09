const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const dotenv = require("dotenv");
dotenv.config();
const cors = require('cors');
const mongodatabase = require("./database/databaseconnect");

mongodatabase();


const User = require('./Models/User');

const app = express();


app.use(cors());
const port = process.env.PORT || 8000;
const jwt = require('jsonwebtoken');




app.use(bodyParser.json());


app.post('/register', async(req, res) => {
    const { username, password } = req.body;




    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
    }




    const hashedPassword = await bcrypt.hash(password, 10);




    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.json({ message: 'User registered successfully' });
});


app.post('/login', async(req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }



    const isMatch = await bcrypt.compare(password, user.password);


    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }


    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
});

app.use(async(req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
});

app.get('/protected', (req, res) => {
    res.json({ message: 'Protected route accessed successfully' });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});