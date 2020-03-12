const { ApolloServer, PubSub } = require('apollo-server')
const mongoose = require('mongoose')

const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers/index')
const { MONGO_DB } = require('./config.js')

const pubsub = new PubSub()

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req, pubsub }),
})

mongoose
  .connect(MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MONGO_DB Connected')
    return server.listen({ port: 5000 })
  })
  .then(res => {
    console.log(`Server started at ${res.url}`)
  })
