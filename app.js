const express = require('express');
const morgan = require('morgan');
const createError = require('http-errors');
require('dotenv').config();
require('./helpers/init_mongodb');
const { verifyAccessToken } = require('./helpers/jwt_helper');
const AuthRoute = require('./routes/auth.routes');
require('./helpers/init_reddis');

// client.SET('foo', 'bar');
// client.GET('foo', (err, value) => {
//     if (err) {
//         console.log(err.message);
//     }
//     console.log(value);
// });

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', verifyAccessToken, async (req, res) => {
    res.send('Hello World');
});

app.use('/auth', AuthRoute);
app.use(async (req, res, next) => {
    // const error = new Error('Not Found');
    // error.status = 404;
    // next(error);
    next(createError.NotFound());
})

app.use(async (error, req, res, next) => {
    res.status(error.status || 500);
    res.send({
        error: {
            status: error.status,
            message: error.message
        },
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

