const { validationResult } = require('express-validator');
const sendWelcomeEmail = require('../utils/sendWelcomeEmail');
const User = require('../model/user.model');
const Post = require('../model/post.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getDataUri = require('../utils/datauri');
const cloudinary = require('../utils/cloudinary')



// Simple validation helper (you can expand)
function isValidEmail(email) {
    const re = /^\S+@\S+\.\S+$/;
    return re.test(email);
}

exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const { username, email, password, phoneNumber } = req.body;

    try {
        // Basic validation
        if (!username || !email || !password || !phoneNumber) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters.' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check if username already exists ONLY
        const existingUser = await User.findOne({ username: username.trim() });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken.' });
        }

        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new User({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            phoneNumber: phoneNumber.trim(),
            fullName: '',
        });

        const user = await newUser.save();

        // 💌 Send welcome email
        await sendWelcomeEmail(user.email, user.username);

        return res.status(201).json({ message: 'User registered successfully!', success:true });


    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Server error. Try again later.' });


    }
}

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Field check
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const user = await User.findOne({ username: username.trim() });

        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const newUser = new User({
            _id: user._id,
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            bio: user.bio,
            website: user.website,
            location: user.location,
            followers: user.followers,
            following: user.following,
            posts: user.posts,
            dateOfBirth: user.dateOfBirth

        })

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '7d' } // 1 week token validity
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        return res.status(200).json({
            message: `Welcome back ${user.username}!`,
            token,
            success: true,
            newUser
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });


    }

}

exports.logout = async (req, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0, httpOnly: true }).json({
            message: "logged out successfully",
            success: true
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

}

exports.getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId)
            .select('-password -__v') // Hide sensitive fields
            .populate('followers', 'username profilePicture')
            .populate('following', 'username profilePicture')
            .populate({
                path: 'posts',
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            message: 'Profile fetched successfully',
            user,
            success: true
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}


exports.editProfile = async (req, res) => {
    try {
        const userId = req.params.id;

        const { fullName, bio, location, gender, phoneNumber, dateOfBirth, website } = req.body;

        // Access file from req.files for multer.fields()
        const profilePicture = req.files && req.files.profilePicture ? req.files.profilePicture[0] : null;

        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture)
            cloudResponse = await cloudinary.uploader.upload(fileUri)
        }

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: 'User not found', success: false });
        }

        if (bio) user.bio = bio;
        if (fullName) user.fullName = fullName;
        if (location) user.location = location;
        if (gender) user.gender = gender;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (website) user.website = website;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated successfully!',
            user,
            success: true
        });


    }
    catch (error) {
        console.error('Edit Profile Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });

    }
}

exports.getSuggestedUser = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get current user
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // Exclude current user + people already followed
        const excludeIds = [userId, ...currentUser.following];

        // Get suggested users
        const suggestedUsers = await User.find({
            _id: { $nin: excludeIds }
        })
            .select("username fullName profilePicture") // You can customize what you return
            .limit(10); // limit to 10 suggestions

        res.status(200).json({
            success: true,
            suggestedUsers
        });

    } catch (err) {
        console.error("Get Suggested Users Error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
};


exports.followOrUnfollow = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.id;

        if (currentUserId.toString() === targetUserId) {
            return res.status(400).json({ success: false, message: "You can't follow yourself." });
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isFollowing = currentUser.following.includes(targetUserId);
        if (isFollowing) {
            // Unfollow
            currentUser.following.pull(targetUserId);
            targetUser.followers.pull(currentUserId);
            await currentUser.save();
            await targetUser.save();
            return res.status(200).json({ success: true, message: "User unfollowed" });
        } else {
            // Follow
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);
            await currentUser.save();
            await targetUser.save();
            return res.status(200).json({ success: true, message: "User followed" });
        }


    } catch (error) {
        console.error("Follow/Unfollow Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

exports.serachUserByUserName = async (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) {
        return res.status(400).json({ error: 'Search keyword is required.' });
    }

    try {
        const users = await User.find({
            username: { $regex: keyword, $options: 'i' }
        }).select('-password');

        if (!users) {
            return res.status(404).json({
                success: false, message: "No matching users found."
            });
        }
        return res.status(200).json({ users });

    } catch (error) {
        console.error("Search User Error:", error);
        res.status(500).json({ success: false, message: "Server error" });

    }
}

