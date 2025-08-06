const User = require("../models/userSchema");
const Post = require("../models/postSchema");

// controllers/userController.js
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .select('-password -__v -updatedAt ');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch user's posts
        const posts = await Post.find({ author: userId })
            .populate('author', 'firstName emailId')
            .sort({ createdAt: -1 })
            .select('-__v');

        res.status(200).json({
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId,
                bio: user.bio,
                createdAt: user.createdAt
            },
            posts,
            message: "Profile fetched successfully"
        });

    } catch (err) {
        res.status(500).send("Error: " + err);
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.info._id;
        const { firstName, bio } = req.body;

        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (bio !== undefined) updateData.bio = bio;

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password -__v');

        if (!updatedUser) throw new Error("User not found");

        const reply = {
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            emailId: updatedUser.emailId,
            bio: updatedUser.bio || ""
        };

        res.status(200).json({
            user: reply,
            message: "Profile updated successfully"
        });

    } catch (err) {
        res.status(400).send("Error: " + err);
    }
};

module.exports = { getUserProfile, updateProfile };