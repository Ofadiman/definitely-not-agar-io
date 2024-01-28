import { faker } from '@faker-js/faker'
import { z } from 'zod'

export const GAME_SETTINGS = {
  DEFAULT_NUMBER_OF_ORBS: 2000,
  DEFAULT_ORB_SIZE: 5,
  DEFAULT_PLAYER_SIZE: 10,
  DEFAULT_PLAYER_SPEED: 2,
  DEFAULT_PLAYER_ZOOM: 1.5,
  DEFAULT_PLAYER_SCORE: 0,
  MAP_HEIGHT: 5000,
  MAP_WIDTH: 5000,
} as const

export type Orb = {
  id: string
  color: string
  location: {
    x: number
    y: number
  }
  size: number
}

export const createOrb = (): Orb => {
  return {
    id: faker.string.uuid(),
    location: {
      x: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH }),
      y: faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT }),
    },
    size: 5,
    color: faker.color.human(),
  }
}

export type Player = {
  id: string
  socketId: string
  name: string
  isAlive: boolean
  speed: number
  zoom: number
  color: string
  size: number
  score: number
  absorbedOrbsCount: number
  location: {
    x: number
    y: number
  }
  vector: {
    x: number
    y: number
  }
}

export const createPlayer = (data: { name: string; socketId: string }): Player => {
  return {
    color: faker.color.human(),
    size: GAME_SETTINGS.DEFAULT_PLAYER_SIZE,
    location: {
      x: 0,
      y: 0,
    },
    speed: GAME_SETTINGS.DEFAULT_PLAYER_SPEED,
    zoom: GAME_SETTINGS.DEFAULT_PLAYER_ZOOM,
    id: faker.string.uuid(),
    name: data.name,
    score: GAME_SETTINGS.DEFAULT_PLAYER_SCORE,
    vector: {
      x: 0,
      y: 0,
    },
    isAlive: true,
    socketId: data.socketId,
    absorbedOrbsCount: 0,
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
