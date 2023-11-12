const mongoose = require('mongoose')

const Schema = mongoose.Schema


const Employee = new Schema({
    name: String,
    email: String,
    password: String,
    address: String,
    phone: Number
})

module.exports = mongoose.model('employees', Employee)