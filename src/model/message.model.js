const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["text", "image", "video", "audio", "file"],
    default: "text"
  },
  mediaUrl: {
    type: String,
  },
  isSeen: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  seenAt: {
    type: Date
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat", // if using group chats or DM rooms
  },
},{
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;