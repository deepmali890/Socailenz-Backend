const Conversation = require("../model/conversation.model");
const Message = require("../model/message.model");

// for chating
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.id

        const { content, type, mediaUrl } = req.body;

        if (!content && !mediaUrl) {
            return res.status(400).json({ success: false, message: "Message content or media is required." });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        })

        // Create new conversation if not found
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: [],
                unreadCounts: [
                    { userId: receiverId, count: 1 },
                    { userId: senderId, count: 0 }
                ]
            });
        }


        // Create a new message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            content,
            type: type || "text",
            mediaUrl: mediaUrl || null,
            chatId: conversation._id
        });


        // Add message to conversation
        conversation.messages.push(newMessage._id);
        conversation.lastMessage = newMessage._id;

        // Update unread count for receiver
        const unreadObj = conversation.unreadCounts.find(u => u.userId.toString() === receiverId.toString());
        if (unreadObj) {
            unreadObj.count += 1;
        } else {
            conversation.unreadCounts.push({ userId: receiverId, count: 1 });
        }

        await conversation.save();

        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage
        });

        // TODO: Emit socket event here (if using Socket.IO)
        // io.to(receiverId).emit('newMessage', newMessage);

    } catch (error) {
        console.error("Error in sendMessage:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while sending message"
        });
    }
}

exports.getMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.id

        const conversation = await Conversation.find({
            participants: { $all: [senderId, receiverId] }
        })

        if (!conversation) return res.status(200).json({ success: true, message: [] });
        const messages = await Message.find({ conversation: conversation._id }).sort({
            createdAt: -1
        }).limit(10);
        return res.status(200).json({
            success: true,
            message: messages
        });

    } catch (error) {
        console.error("Error in getMessage:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while getting message"
        });
    }
}