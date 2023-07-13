// server.js

const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./db/connect');

// Import your routes

const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());
app.use(bodyParser.json());

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);

const port = process.env.PORT || 8000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI)
        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

start();
