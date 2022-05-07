const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const client = require('./init_reddis');
module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {
                // this throw an eroor because we have use issuer and audience in options
                // issuer 
                // iss: 'picturpage.com',
            };
            const secret = process.env.ACCESS_TOKEN_SECRET;
            const options = {
                expiresIn: '30s',
                issuer: 'picturpage.com',
                audience: userId
            }
            jwt.sign(payload, secret, options, (err, token) => {
                if (err) {
                    console.log(err.message);
                    // reject(err)
                    reject(createError.InternalServerError(err.message));

                };
                resolve(token);
            });
            // jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }, (err, token) => {
            //     if (err) {
            //         reject(err);
            //     } else {
            //         resolve(token);
            //     }
            // });
        });
    },

    verifyAccessToken: (req, res, next) => {
        if (!req.headers['authorization']) {
            return next(createError.Unauthorized());
        }
        const token = req.headers['authorization'].split(' ')[1];
        const secret = process.env.ACCESS_TOKEN_SECRET;
        jwt.verify(token, secret, (err, payload) => {
            if (err) {
                // if (err.name === 'JsonWebTokenError') {
                //     return next(createError.Unauthorized());
                // } else {
                //     // actual error from jsonwebtoken
                //     return next(createError.Unauthorized(err.message));
                // }

                // same as above if else statement but shorter
                const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
                return next(createError.Unauthorized(message));
            }
            req.payload = payload;
            next();
        });

    },

    signRefreshToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {};
            const secret = process.env.REFRESH_TOKEN_SECRET;
            const options = {
                expiresIn: '1y',
                issuer: 'picturpage.com',
                audience: userId
            }
            jwt.sign(payload, secret, options, (err, token) => {
                if (err) {
                    console.log(err.message);
                    // reject(err)
                    reject(createError.InternalServerError());

                };

                client.SET(userId, token, 'EX', 360 * 24 * 60 * 60, (err, reply) => {
                    if (err) {
                        console.log(err.message);
                        reject(createError.InternalServerError());
                        return;
                    }
                    resolve(token);
                });
            });
        });
    },

    // jsonwebtoken libary does not have promise inbuilt so we have to return promise
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {

            const secret = process.env.REFRESH_TOKEN_SECRET;
            jwt.verify(refreshToken, secret, (err, payload) => {
                if (err) return reject(createError.Unauthorized());

                // we can use aud in the place of audeince
                const userId = payload.aud;
                client.GET(userId, (err, result) => {
                    if (err) {
                        console.log(err.message);
                        reject(createError.InternalServerError());
                        return;
                    }
                    // {key : value} value is result from the redis and 
                    //  value = refreshToken = result  
                    if (refreshToken === result)
                        resolve(userId);

                    // refresh token and result are not equal
                    reject(createError.Unauthorized());

                });
            });

        });
    }

};



// Access Token
// 1. Access Token is a JWT token that is sent to the client
// 2. Access Token are used to authorize the client to access the protected resources 
