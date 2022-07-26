const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    imageUrl: {type: String, required: true},
    name: {type: String, required: true},
    currentPrice: {type : String, required: true},
    previousPrice: {type : String},
    offer: {type: String},
    stockStatus: {type: String, required: true},
    email: {type: String, required: true}
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;