import { faker } from '@faker-js/faker'
import { Collideable } from './utils'
import { GAME_SETTINGS } from '.'

export type Player = {
  socketId: string
  name: string
  isAlive: boolean
  isBot: boolean
  speed: number
  zoom: number
  color: string
  score: number
  absorbedOrbsCount: number
  absorbedPlayersCount: number
  vector: {
    x: number
    y: number
  }
} & Collideable

export const createPlayer = (data: { name: string; socketId: string; isBot: boolean }): Player => {
  return {
    color: faker.color.human(),
    radius: GAME_SETTINGS.DEFAULT_PLAYER_RADIUS,
    location: {
      x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
      y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
    },
    speed: GAME_SETTINGS.DEFAULT_PLAYER_SPEED,
    zoom: GAME_SETTINGS.DEFAULT_PLAYER_ZOOM,
    name: data.name,
    score: GAME_SETTINGS.DEFAULT_PLAYER_SCORE,
    vector: {
      x: 0,
      y: 0,
    },
    isAlive: true,
    isBot: data.isBot,
    socketId: data.socketId,
    absorbedOrbsCount: 0,
    absorbedPlayersCount: 0,
  }
}
