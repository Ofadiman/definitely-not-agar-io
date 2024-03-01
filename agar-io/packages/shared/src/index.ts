import { faker } from '@faker-js/faker'
import { z } from 'zod'

export const GAME_SETTINGS = {
  DEFAULT_NUMBER_OF_ORBS: 2000,
  DEFAULT_PLAYER_SIZE: 10,
  DEFAULT_PLAYER_SPEED: 2,
  DEFAULT_PLAYER_ZOOM: 1.5,
  DEFAULT_PLAYER_SCORE: 0,
  MAP_HEIGHT: 5000,
  MAP_WIDTH: 5000,
  ORB_SIZE: 5,
  FPS: 60,
} as const

export type Collideable = {
  location: {
    x: number
    y: number
  }
  size: number
}

export type Orb = {
  id: string
  color: string
} & Collideable

export const createOrb = (): Orb => {
  return {
    id: faker.string.uuid(),
    location: {
      x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
      y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
    },
    size: GAME_SETTINGS.ORB_SIZE,
    color: faker.color.human(),
  }
}

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
    size: GAME_SETTINGS.DEFAULT_PLAYER_SIZE,
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

export type Game = {
  orbs: Record<string, Orb>
  players: Record<string, Player>
}

export type ServerToClientEvents = {
  gameState: (data: Game) => void
  tick: (data: Record<string, Player>) => void
  orbConsumed: (data: { consumedOrbId: string; newOrb: Orb }) => void
  playerConsumed: (data: { consumedPlayerId: string; consumedById: string }) => void
}

export type ClientToServerEvents = {
  joinGame: (data: { name: string }) => void
  tock: (data: { x: number; y: number }) => void
}

export type InterServerEvents = {}

export type SocketData = {}

export const playerFormSchema = z.object({
  name: z.string().min(3).max(20),
})

export type PlayerForm = z.infer<typeof playerFormSchema>

export const loop = (args: { fps: number; callback: () => void }): (() => void) => {
  const intervalId = setInterval(args.callback, 1000 / args.fps)

  const cancel = () => {
    clearInterval(intervalId)
  }

  return cancel
}
