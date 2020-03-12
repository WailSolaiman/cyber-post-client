const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { UserInputError } = require('apollo-server')

const User = require('../../models/User')
const { SECRET_KEY } = require('../../config')
const {
  validateRegisterInput,
  validateLoginInput,
} = require('../../util/validators')

const generateToken = user => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  }
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' })
}

module.exports = {
  Mutation: {
    async register(
      _,
      { registerInput: { username, email, password, confirmPassword } }
    ) {
      // DONE: Validate user data
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      )
      if (!valid) {
        throw new UserInputError('Errors', {
          errors,
        })
      }
      // DONE: User should not already exist
      const user = await User.findOne({ username })
      if (user) {
        throw new UserInputError('Username is taken!', {
          errors: {
            username: 'This username is taken',
          },
        })
      }
      // DONE: Hash password and create an Auth Token
      password = await bcrypt.hash(password, 12)
      const newUser = new User({
        username,
        password,
        email,
        createdAt: new Date().toISOString(),
      })
      const res = await newUser.save()
      const token = generateToken(res)
      return {
        ...res._doc,
        id: res._id,
        token,
      }
    },
    async login(_, { loginInput: { username, password } }) {
      // DONE: Validate user data
      const { valid, errors } = validateLoginInput(username, password)
      if (!valid) {
        throw new UserInputError('Errors', { errors })
      }
      // Get User data from DB
      const user = await User.findOne({ username })
      if (!user) {
        errors.general = 'User no found'
        throw new UserInputError('User no found', { errors })
      }
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        errors.general = 'Wrong credentials'
        throw new UserInputError('Wrong credentials', { errors })
      }
      const token = generateToken(user)
      return {
        ...user._doc,
        id: user._id,
        token,
      }
    },
  },
}
