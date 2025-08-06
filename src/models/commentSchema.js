const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
        maxLength: 500,
        trim: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }
}, {
    timestamps: true
});

commentSchema.index({ post: 1 });

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;