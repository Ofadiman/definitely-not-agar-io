import { faker } from '@faker-js/faker'
import { GAME_SETTINGS } from './settings'

export class PlayerData {
  public color: string = faker.color.human()
  public radius: number = GAME_SETTINGS.DEFAULT_PLAYER_SIZE
  public locX: number = faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH })
  public locY: number = faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT })
  public score: number = 0
  public absorbOrbsCount: number = 0

  constructor(public name: string) { }
}

export class PlayerConfig {
  public xVector = 0
  public yVector = 0
  public speed = GAME_SETTINGS.DEFAULT_PLAYER_SPEED
  public zoom = GAME_SETTINGS.DEFAULT_ZOOM

  constructor() { }
}

export class Player {
  constructor(
    public state: {
      socketId: string
      config: PlayerConfig
      data: PlayerData
      isAlive: boolean
    },
  ) { }
}
