import 'dotenv/config'
import fp from 'fastify-plugin'
import { GameSettings } from 'shared'

declare module 'fastify' {
  interface FastifyInstance {
    gameSettings: GameSettings
  }
}

export const gameSettingsPlugin = fp(function (fastify, _opts, done) {
  const gameSettings: GameSettings = {
    fps: fastify.env.FPS,
    map: {
      width: fastify.env.MAP_WIDTH,
      height: fastify.env.MAP_HEIGHT,
    },
    orbRadius: fastify.env.ORB_RADIUS,
    initialPlayerRadius: fastify.env.INITIAL_PLAYER_RADIUS,
  }

  fastify.decorate('gameSettings', gameSettings)

  done()
})
