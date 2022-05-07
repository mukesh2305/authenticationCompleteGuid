const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

// pre is middleware so we are using next() to pass the error to the next middleware
UserSchema.pre('save', async function (next) {
    try {
        // console.log("Called before saving user");
        // console.log(this.email, this.password);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error)
    }
})

// but isValidPassword is not a middleware so we are not using next()
// just throw error if password is wrong
UserSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
}


// UserSchema.post('save', async function (next) {
//     try {
//         console.log("Called after saving user");
//     } catch (error) {
//         next(error)
//     }
// })


module.exports = mongoose.model('User', UserSchema);
