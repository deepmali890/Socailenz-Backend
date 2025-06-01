const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    caption: {
        type: String,
        required: true
    },
    images: [{ type: String, required: true }],
    music: {
        type: String,  // URL for the music file (Cloudinary hosted)
        default: ''
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        }
    ],
    location: {
        type: String
    },

}, {
    timestamps: true
})

const Post = mongoose.model('Post', postSchema);
module.exports = Post;