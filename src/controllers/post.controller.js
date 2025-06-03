const sharp = require('sharp');
const cloudinary = require('../utils/cloudinary');
const Post = require('../model/post.model');
const Comment = require('../model/comment.model');
const User = require('../model/user.model');
const Notification = require('../model/notification.model');


exports.addNewPost = async (req, res) => {
    try {
        const { caption, location } = req.body;
        const author = req.user._id;

        const imagesFiles = req.files && req.files.post ? req.files.post : [];
        const musicFile = req.files && req.files.music ? req.files.music[0] : null;

        if (imagesFiles.length === 0) {
            return res.status(400).json({ success: false, error: 'At least one image is required' });
        }
        // Process & upload all images one by one after resizing with sharp
        const imagesUrls = [];
        for (const file of imagesFiles) {
            // Resize & optimize image buffer with sharp
            const optimizedImageBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside' })
                .jpeg({ quality: 80 })
                .toBuffer();


            // Convert optimized buffer to Data URI for Cloudinary
            const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;


            // Upload to Cloudinary
            const cloudResponse = await cloudinary.uploader.upload(fileUri, {
                folder: 'posts',
                public_id: `post-image-${author}-${Date.now()}`
            });

            imagesUrls.push(cloudResponse.secure_url);
        }


        let musicUrl = ''
        if (musicFile) {
            const musicBuffer = musicFile.buffer;
            const musicExt = musicFile.originalname.split('.').pop();

            const musicDataUri = `data:audio/${musicExt};base64,${musicBuffer.toString('base64')}`;

            const musicUploadResp = await cloudinary.uploader.upload(musicDataUri, {
                resource_type: 'video',  // Cloudinary handles audio as video resource_type
                folder: 'posts/music',
                public_id: `post-music-${author}-${Date.now()}`
            });

            musicUrl = musicUploadResp.secure_url;
        }

        // Create and save post document
        const post = new Post({
            caption,
            images: imagesUrls,
            music: musicUrl,
            location: location || '',
            author
        });

        await post.save();

        // Add this part to update user's posts array:
        const user = await User.findById(author);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }

        await post.populate({ path: 'author', select: 'username profilePicture' });


        return res.status(201).json({
            success: true,
            message: 'Post created successfully!',
            post
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })


    }
}

exports.getAllPosts = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate({
                path: 'author',
                select: 'username profilePicture'
            })
            .populate({
                path: 'comments',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'author',
                    select: 'username profilePicture',
                },
            })
            .populate('likes', 'username profilePicture')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: posts.length,
            currentPage: page,
            posts,
        });
    } catch (error) {
        console.error('❌ Error in getAllPosts:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
};


exports.getUserPost = async (req, res) => {
    try {
        const authorId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const posts = await Post.find({ author: authorId })
            .populate({
                path: 'author',
                select: 'username profilePicture'
            })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            })
            .populate('likes', 'username profilePicture')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: posts.length,
            posts
        });
    } catch (error) {
        console.error('Error in getUserPost:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }

}

exports.updatePostByUser = async (req, res) => { }


// controllers/post.controller.js

exports.toggleLikePost = async (req, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.user._id;
  
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
  
      // Check if user already liked the post
      const hasLiked = post.likes.includes(userId);
  
      let updatedPost;
      if (hasLiked) {
        // If liked, unlike (remove userId from likes array)
        updatedPost = await Post.findByIdAndUpdate(
          postId,
          { $pull: { likes: userId } },
          { new: true }
        );
      } else {
        // If not liked, add like
        updatedPost = await Post.findByIdAndUpdate(
          postId,
          { $addToSet: { likes: userId } },
          { new: true }
        );
      }
  
      return res.status(200).json({
        success: true,
        message: hasLiked ? 'Post unliked' : 'Post liked',
        likesCount: updatedPost.likes.length,
        liked: !hasLiked,
      });
    } catch (error) {
      console.error('Error in toggleLikePost:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

// // Like Post
// exports.likepost = async (req, res) => {
//     try {
//         const postId = req.params.postId;
//         const userId = req.user._id;

//         const post = await Post.findById(postId);
//         if (!post) {
//             return res.status(404).json({ success: false, message: 'Post not found' });
//         }

//         await Post.updateOne({ _id: postId }, { $addToSet: { likes: userId } });
//         const updatedPost = await Post.findById(postId);

//         return res.status(200).json({
//             success: true,
//             message: 'Post liked',
//             likesCount: updatedPost.likes.length,
//             liked: true
//         });
//     } catch (error) {
//         console.error('Error in likepost:', error);
//         return res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// // Dislike Post
// exports.disLikePost = async (req, res) => {
//     try {
//         const postId = req.params.postId;
//         const userId = req.user._id;

//         const post = await Post.findById(postId);
//         if (!post) {
//             return res.status(404).json({ success: false, message: 'Post not found' });
//         }

//         await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
//         const updatedPost = await Post.findById(postId);

//         return res.status(200).json({
//             success: true,
//             message: 'Post disliked',
//             likesCount: updatedPost.likes.length,
//             liked: false
//         });
//     } catch (error) {
//         console.error('Error in disLikePost:', error);
//         return res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// exports.likePost = async (req, res) => {
//     try {
//         const postId = req.params.postId;
//         const userId = req.user._id;

//         // Find the post and populate author
//         const post = await Post.findById(postId).populate('author');
//         if (!post) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Post not found'
//             });
//         }

//         // Check if user already liked this post
//         const alreadyLiked = post.likes.includes(userId);

//         if (alreadyLiked) {
//             // Unlike: remove userId from likes
//             post.likes = post.likes.filter(id => id.toString() !== userId.toString());
//         } else {
//             // Like: add userId to likes
//             post.likes.push(userId);
//         }

//         // Send Notification only if the user is not liking their own post
//         if (userId.toString() !== post.author._id.toString()) {
//             const notification = new Notification({
//                 sender: userId,
//                 receiver: post.author._id,
//                 post: postId,
//                 type: 'like',
//                 message: `${req.user.username} liked your post.`
//             });
//             await notification.save();
//             console.log(notification)

//             // Emit real-time notification if using socket.io
//             if (req.app.get('io')) {
//                 req.app.get('io').to(post.author._id.toString()).emit('newNotification', {
//                     type: 'like',
//                     sender: req.user.username,
//                     postId,
//                     message: `${req.user.username} liked your post.`
//                 });
//             }
//         }

//         await post.save();

//         return res.status(200).json({
//             success: true,
//             message: alreadyLiked ? 'Post unliked' : 'Post liked',
//             likesCount: post.likes.length,
//             liked: !alreadyLiked
//         });

//     } catch (error) {
//         console.error('Error in likePost:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

exports.allLikedPostByUser = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find posts where user has liked
        const likedPosts = await Post.find({ likes: { $in: [userId] } })
            .populate('author', 'username profilePicture')
            .populate({
                path: 'comments',
                populate: [
                    {
                        path: 'author',
                        select: 'username profilePicture'
                    },
                    {
                        path: 'likes',
                        select: 'username profilePicture'
                    },
                    {
                        path: 'comments',
                        populate: {
                            path: 'author',
                            select: 'username profilePicture'
                        }
                    }
                ]
            })
            .populate('likes', 'username profilePicture')
            .sort({ createdAt: -1 });

        if (likedPosts.length === 0) {
            return res.status(200).json({ success: true, message: 'No liked posts found ', likedPosts: [] });
        }

        return res.status(200).json({
            success: true,
            message: 'Liked posts fetched successfully',
            likedPosts
        });

    } catch (error) {
        console.error('Error in allLikedPostByUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error — unable to fetch liked posts'
        });
    }
};


exports.addComment = async (req, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.user._id;
      const { text } = req.body;
  
      if (!text || text.trim() === '') {
        return res.status(400).json({ success: false, message: 'Comment text is required' });
      }
  
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
  
      // Create comment first
      let comment = await Comment.create({
        text,
        author: userId,
        post: postId
      });
  
      // Then populate the comment author
      comment = await comment.populate('author', 'username profilePicture');
  
      post.comments.push(comment._id);
      await post.save();
  
      return res.status(201).json({
        success: true,
        message: comment
      });
  
    } catch (error) {
      console.error('Error in addComment:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

exports.getAllCommentsByPost = async (req, res) => {
    try {
        const postId = req.params.postId;

        // Validate post existence
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Fetch all comments for the post
        const comments = await Comment.find({ post: postId })
            .populate('author', 'username profilePicture')
            .sort({ createdAt: -1 });

        if (!comments) return res.status(404).json({ success: false, message: 'No comments found' });

        return res.status(200).json({
            success: true,
            count: comments.length,
            comments
        });

    } catch (error) {
        console.error('Error in getAllCommentsByPost:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}

exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const authorId = req.user._id;


        // Validate post existence
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Check if the user owns the post (traditional rule: only owner can delete)
        if (post.author.toString() !== authorId.toString()) {
            return res.status(403).json({ success: false, message: 'You do not own this post' });
        }

        // Delete all comments linked to this post (clean slate, no debris left behind)
        await Comment.deleteMany({ post: postId });

        // Delete all notifications related to this post (no loose ends)
        await Notification.deleteMany({ post: postId });

        //delete post
        await Post.findByIdAndDelete(postId);

        // remove the post from user post
        let user = await User.findById(authorId);
        user.posts = user.posts.filter((id) => id.toString() !== postId.toString());
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Post deleted successfully. The past is cleared, ready for the future.'
        });


    } catch (error) {
        console.error('Error in deletePost:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error — something went sideways in the underworld.'
        });
    }
}

exports.bookMarkPost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const authorId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false, message: 'Post not found'
            })
        }

        const user = await User.findById(authorId);

        const alreadyBookmarked = user.bookmarks.includes(postId);

        if (alreadyBookmarked) {
            // Remove bookmark
            user.bookmarks = user.bookmarks.filter(
                (id) => id.toString() !== postId.toString()
            )
        } else {
            // Add bookmark
            user.bookmarks.push(postId);
        }
        await user.save();

        return res.status(200).json({
            success: true,
            message: alreadyBookmarked
                ? 'Post removed from bookmarks'
                : 'Post bookmarked successfully',
            bookmarked: !alreadyBookmarked,
        });


    } catch (error) {
        console.error('Error in bookMarkPost:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error — unable to process bookmark.',
        });
    }
}

exports.AllBookMarksByUser = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch the user with populated bookmarks
        const user = await User.findById(userId)
            .populate({
                path: 'bookmarks',
                populate: {
                    path: 'author',
                    select: 'username email' // include more fields if needed
                }
            })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Fetched bookmarked posts successfully',
            bookmarks: user.bookmarks,
        });


    } catch (error) {
        console.error('Error in AllBookMarksByUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error — unable to fetch bookmarks',
        });
    }
}


