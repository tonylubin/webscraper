const mongoose = require('mongoose');

// Boots website
const ProductSchema = new mongoose.Schema({
    imageUrl: {type: String, required: true},
    name: {type: String, required: true},
    currentPrice: {type : String, required: true},
    previousPrice: {type : String},
    offer: {type: String},
    stockStatus: {type: String, required: true},
    email: {type: String, required: true}
}, {timestamps: true} );

const Product = mongoose.model('Product', ProductSchema);

// Sainsbury's website
const ShopingItemSchema = new mongoose.Schema({
    title: {type: String, required: true},
    offerPrice: {type: String},
    retailPrice: {type: String, required: true},
    promotionMsg: {type: String},
    nectarOffer: {type: String},
    imageUrl: {type: String, required: true},
    email: {type: String, required: true},
    offer: {type: String}
}, {timestamps: true});

const ShoppingItem = mongoose.model('ShoppingItem', ShopingItemSchema);

module.exports = { Product, ShoppingItem };