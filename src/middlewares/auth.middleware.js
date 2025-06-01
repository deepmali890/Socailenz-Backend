const jwt = require('jsonwebtoken');
const User = require('../model/user.model');
require('dotenv').config()

exports.protectRoute = async (req, res, next) => {
    const token = req.cookies.token; // 👈 corrected

    if (!token) {
        return res.status(401).json({ msg: "Unauthorized: No token found" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ msg: "Unauthorized: User not found" });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error("JWT error:", error);
        return res.status(401).json({ msg: "Unauthorized: Invalid token" });
    }
};
