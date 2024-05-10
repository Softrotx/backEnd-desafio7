const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    age: Number,
    email: {
        type: String,
        unique: true
    },
    password: String,
    cart: { type: mongoose.Schema.Types.ObjectId, require: true, ref:"Carts"},
    role: { type: String, default: 'user' }
    
})

module.exports = mongoose.model('User', schema, 'users')