const mongoose = require('mongoose');

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

module.exports = ShoppingItem;