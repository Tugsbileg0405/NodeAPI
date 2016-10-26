var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('User', new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    admin: {
        type: Boolean,
        default: false
    },
    article: [{
        type: Schema.ObjectId,
        ref: 'Article'
    }]
}));
