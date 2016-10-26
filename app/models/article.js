var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Article', new Schema({
    caption: String,
    description: String,
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    picture: String,
    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date,
        default: Date.now
    }
}));