const Post = require("../models/postSchema");
const Comment = require("../models/commentSchema");

const createPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.info._id;

        if (!title || !content) throw new Error("Title and content are required");

        const postData = {
            title,
            content,
            author: userId
        };

        const post = await Post.create(postData);
        
        // Populate author info for response
        const populatedPost = await Post.findById(post._id)
            .populate('author', 'firstName lastName emailId')
            .select('-__v');

        res.status(201).json({
            post: populatedPost,
            message: "Post created successfully"
        });

    } catch (err) {
        res.status(400).send("Error: " + err);
    }
};

const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate('author', 'firstName lastName emailId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        res.status(200).json({
            posts: posts,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalPosts: totalPosts,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            message: "Posts fetched successfully"
        });

    } catch (err) {
        res.status(500).send("Error: " + err);
    }
};

const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, content } = req.body;
        const userId = req.info._id;

        if (!title && !content) {
            throw new Error("At least title or content must be provided for update");
        }

        if (title && title.trim().length === 0) {
            throw new Error("Title cannot be empty");
        }

        if (content && content.trim().length === 0) {
            throw new Error("Content cannot be empty");
        }

        // Check if post exists and belongs to user
        const post = await Post.findById(postId);
        if (!post) throw new Error("Post not found");

        console.log('Found post:', {
            _id: post._id,
            author: post.author,
            authorType: typeof post.author,
            title: post.title
        });

        // Convert both IDs to strings for comparison
        const postAuthorId = post.author.toString();
        const currentUserId = userId.toString();
        
        console.log('Comparison:', {
            postAuthorId: postAuthorId,
            currentUserId: currentUserId,
            match: postAuthorId === currentUserId
        });

        if (postAuthorId !== currentUserId) {
            throw new Error(`Unauthorized: You can only update your own posts. Post author: ${postAuthorId}, Current user: ${currentUserId}`);
        }

        // Prepare update data
        const updateData = {};
        if (title) updateData.title = title.trim();
        if (content) updateData.content = content.trim();

        console.log('Update data:', updateData);

        // Update the post
        const updatedPost = await Post.findByIdAndUpdate(
            postId, 
            updateData, 
            { new: true, runValidators: true }
        ).populate('author', 'firstName lastName emailId')
         .select('-__v');

        console.log('Post updated successfully');

        res.status(200).json({
            post: updatedPost,
            message: "Post updated successfully"
        });

    } catch (err) {
        console.error('Update post error:', err.message);
        
        if (err.message.includes("Unauthorized")) {
            res.status(403).send("Error: " + err);
        } else if (err.message.includes("not found")) {
            res.status(404).send("Error: " + err);
        } else {
            res.status(400).send("Error: " + err);
        }
    }
};

const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.info._id;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) throw new Error("Post not found");

        // Convert both IDs to strings for comparison
        const postAuthorId = post.author.toString();
        const currentUserId = userId.toString();

        if (postAuthorId !== currentUserId) {
            throw new Error("Unauthorized: You can only delete your own posts");
        }

        // Delete all comments associated with this post
        await Comment.deleteMany({ post: postId });

        await Post.findByIdAndDelete(postId);

        res.status(200).json({
            message: "Post deleted successfully"
        });

    } catch (err) {
        console.error('Delete post error:', err.message);
        if (err.message.includes("Unauthorized")) {
            res.status(403).json({ error: err.message });
        } else if (err.message.includes("not found")) {
            res.status(404).json({ error: err.message });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
};

//LIKE FUNCTION - One like per user, toggle functionality
const likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.info._id;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) throw new Error("Post not found");

        // Check if user has already liked this post
        const hasLiked = post.likedBy && post.likedBy.includes(userId);

        let updatedPost;
        let message;

        if (hasLiked) {
            // Unlike: Remove user from likedBy array and decrement count
            updatedPost = await Post.findByIdAndUpdate(
                postId, 
                { 
                    $pull: { likedBy: userId },
                    $inc: { likeCount: -1 }
                },
                { new: true }
            );
            message = "Post unliked successfully";
        } else {
            // Like: Add user to likedBy array and increment count
            updatedPost = await Post.findByIdAndUpdate(
                postId, 
                { 
                    $addToSet: { likedBy: userId }, // $addToSet prevents duplicates
                    $inc: { likeCount: 1 }
                },
                { new: true }
            );
            message = "Post liked successfully";
        }
        
        res.status(200).json({
            likeCount: updatedPost.likeCount,
            isLiked: !hasLiked, // Current like status after the operation
            message: message
        });

    } catch (err) {
        if (err.message.includes("not found")) {
            res.status(404).send("Error: " + err);
        } else {
            res.status(500).send("Error: " + err);
        }
    }
};

// CREATE COMMENT FUNCTION
const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.info._id;

        if (!content || !content.trim()) {
            throw new Error("Comment content is required");
        }

        if (content.trim().length > 500) {
            throw new Error("Comment must be 500 characters or less");
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) throw new Error("Post not found");

        // Create comment
        const comment = await Comment.create({
            content: content.trim(),
            author: userId,
            post: postId
        });

        // Increment comment count in post
        await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

        // Populate the comment with author info
        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'firstName lastName emailId')
            .select('-__v');

        res.status(201).json({
            comment: populatedComment,
            message: "Comment created successfully"
        });

    } catch (err) {
        if (err.message.includes("not found")) {
            res.status(404).send("Error: " + err);
        } else {
            res.status(400).send("Error: " + err);
        }
    }
};

// GET COMMENTS FOR A POST
const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) throw new Error("Post not found");

        const comments = await Comment.find({ post: postId })
            .populate('author', 'firstName lastName emailId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const totalComments = await Comment.countDocuments({ post: postId });
        const totalPages = Math.ceil(totalComments / limit);

        res.status(200).json({
            comments: comments,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalComments: totalComments,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            message: "Comments fetched successfully"
        });

    } catch (err) {
        if (err.message.includes("not found")) {
            res.status(404).send("Error: " + err);
        } else {
            res.status(500).send("Error: " + err);
        }
    }
};

module.exports = { 
    createPost, 
    getAllPosts, 
    updatePost, 
    deletePost, 
    likePost,
    createComment,
    getPostComments
};