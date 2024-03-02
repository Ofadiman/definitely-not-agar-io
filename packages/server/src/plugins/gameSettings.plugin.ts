import 'dotenv/config'
import fp from 'fastify-plugin'
import { gameSettingsSchema } from 'shared'

export const gameSettingsPlugin = fp(function (fastify, _opts, done) {
  const gameSettings = gameSettingsSchema.parse(process.env)

  fastify.log.debug(gameSettings)

  fastify.decorate('gameSettings', gameSettings)
  done()
})
