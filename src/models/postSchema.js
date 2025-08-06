const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    likeCount: {
        type: Number,
        default: 0,
        min: 0
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    commentCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

postSchema.index({ author: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likedBy: 1 });

module.exports = mongoose.model("Post", postSchema);