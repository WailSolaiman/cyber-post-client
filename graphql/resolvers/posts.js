const { AuthenticationError } = require('apollo-server')

const Post = require('../../models/Post')
const checkAuth = require('../../util/check-auth')

module.exports = {
  Query: {
    getPosts: async () => {
      try {
        return await Post.find().sort({ createdAt: -1 })
      } catch (error) {
        throw new Error(error)
      }
    },
    getPost: async (_, { postId }) => {
      try {
        return await Post.findById(postId)
      } catch (error) {
        throw new Error(error)
      }
    },
  },
  Mutation: {
    createPost: async (_, { body }, context) => {
      const user = checkAuth(context)
      if (body.trim() === '') {
        throw new UserInputError('Empty post', {
          errors: {
            body: 'Post body must not be empty',
          },
        })
      }
      const newPost = new Post({
        body,
        username: user.username,
        createdAt: new Date().toISOString(),
        user: user.id,
      })
      const post = await newPost.save()
      context.pubsub.publish('NEW_POST', {
        newPost: post,
      })
      return post
    },
    deletePost: async (_, { postId }, context) => {
      const user = checkAuth(context)
      try {
        const post = await Post.findById(postId)
        if (user.username === post.username) {
          await post.delete()
          return 'Post deleted successfully'
        } else {
          throw new AuthenticationError('Action not allowed')
        }
      } catch (err) {
        throw new Error(err)
      }
    },
    likePost: async (parent, { postId }, context, info) => {
      const { username } = checkAuth(context)
      const post = await Post.findById(postId)
      if (post) {
        if (post.likes.find(like => like.username === username)) {
          // Post already likes, unlike it
          post.likes = post.likes.filter(like => like.username !== username)
        } else {
          // Not liked, like post
          post.likes.push({
            username,
            createdAt: new Date().toISOString(),
          })
        }
        await post.save()
        return post
      } else throw new UserInputError('Post not found')
    },
  },
  Subscription: {
    newPost: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator('NEW_POST'),
    },
  },
}
