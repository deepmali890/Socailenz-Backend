const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'comment', 'follow'], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    message: String,
    read: { type: Boolean, default: false },
}, {
    timestamps: true
}
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

