const User = require('../models/user.model');
const createError = require('http-errors');
const { authSchema } = require('../helpers/validation_schema');
const { signAccessToken, verifyRefreshToken, signRefreshToken } = require('../helpers/jwt_helper');
const client = require('../helpers/init_reddis');


module.exports = {
    register: async (req, res, next) => {
        try {
            // if (!email || !password)
            // throw createError(400, "Email and password are required");
            const result = await authSchema.validateAsync(req.body);


            const doesExist = await User.findOne({ email: result.email });
            if (doesExist)
                throw createError.Conflict(`User ${result.email} already exists`);

            // const user = new User({ email : result.email, password: result.password });
            const user = new User(result);

            // when we are saving this user then middleware us call 
            //  so we can hash password when we save 
            // so we can use hasing method inside the model also
            await user.save();
            const accessToken = await signAccessToken(user.id);
            const refreshToken = await signAccessToken(user.id, { isRefreshToken: true });
            res.send({
                accessToken,
                refreshToken,
            });

        } catch (error) {
            if (error.isJoi === true) error.status = 422;
            next(error);
        }
    },

    login: async (req, res) => {
        try {

            const result = await authSchema.validateAsync(req.body);
            const user = await User.findOne({ email: result.email });

            if (!user) throw createError.NotFound("User not Registered");

            // user has access to isValidPassword method
            const isMatch = await user.isValidPassword(result.password);
            if (!isMatch) throw createError.Unauthorized("Username/Password is not valid");

            const accessToken = await signAccessToken(user.id);
            const refreshToken = await signRefreshToken(user.id);
            res.send({
                accessToken,
                refreshToken,
            });
        } catch (error) {
            if (error.isJoi === true) return next(createError.BadRequest("Invalid email or password"));
            // next function is used to pass the error to the next middleware that we bulid in the app.js
            next(error);
        }
    },

    refreshToken: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) throw createError.BadRequest("Refresh token is required");
            const userId = await verifyRefreshToken(refreshToken);

            // Generate new pair of access and refresh tokens when Access token is expired
            const newaccessToken = await signAccessToken(userId);
            const newRefreshToken = await signRefreshToken(userId);
            console.log(newRefreshToken, "\n", newaccessToken);
            res.send({
                accessToken: newaccessToken,
                refreshToken: newRefreshToken
            });

        } catch (error) {
            next(error);
        }
    },

    logout: async (req, res, next) => {
        try {
            console.log("logout", req.body);
            const { refreshToken } = req.body;
            if (!refreshToken) throw createError.BadRequest("Refresh token is required");
            const userId = await verifyRefreshToken(refreshToken);

            client.DEL(userId, (err, value) => {
                if (err) {
                    console.log(err);
                    throw createError.InternalServerError(err);
                }
                console.log(value);
                // res.sendStatus(204); // NO CONTENT
                res.status(200).send({
                    message: "Logged out successfully"
                });
            });
        } catch (error) {
            next(error);
        }
    },



}