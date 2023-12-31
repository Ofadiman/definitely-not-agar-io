import { faker } from '@faker-js/faker'

export const GAME_SETTINGS = {
  DEFAULT_NUMBER_OF_ORBS: 500,
  DEFAULT_PLAYER_SPEED: 3,
  DEFAULT_PLAYER_SIZE: 6,
  DEFAULT_ORB_SIZE: 5,
  DEFAULT_ZOOM: 1.5,
  MAP_WIDTH: 500,
  MAP_HEIGHT: 500,
} as const

export class Orb {
  public color = faker.color.human()
  public locX = faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH })
  public locY = faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT })
  public radius = 5
}

export class PlayerData {
  public color: string = faker.color.human()
  public radius: number = GAME_SETTINGS.DEFAULT_PLAYER_SIZE
  public locX: number = faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH })
  public locY: number = faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT })
  public score: number = 0
  public absorbOrbsCount: number = 0

  constructor(public name: string) {}
}

export class PlayerConfig {
  public xVector = 0
  public yVector = 0
  public speed = GAME_SETTINGS.DEFAULT_PLAYER_SPEED
  public zoom = GAME_SETTINGS.DEFAULT_ZOOM

  constructor() {}
}

export class Player {
  constructor(
    public state: {
      socketId: string
      config: PlayerConfig
      data: PlayerData
      isAlive: boolean
    },
  ) {}
}

export type ServerToClientEvents = {
  initServer: (data: { orbs: Orb[]; player: Player }) => void
  tick: (data: Player[]) => void
  orbSwitch: (data: { orbIndex: number; newOrb: Orb }) => void
  playerAbsorbed: (data: { absorbed: string; absorbedBy: string }) => void
}

export type ClientToServerEvents = {
  initClient: (username: string) => void
  tock: (data: { xVector: number; yVector: number }) => void
}

export type InterServerEvents = {}

export type SocketData = {}
