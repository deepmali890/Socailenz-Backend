const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String
    },
    profilePicture: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Like'
        }
    ],
    bookmarks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post'
        }
    ],
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male'
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    dateOfBirth: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true })

const User = mongoose.model('User', userSchema)

module.exports = User