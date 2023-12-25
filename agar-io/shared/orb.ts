import { faker } from '@faker-js/faker'
import { GAME_SETTINGS } from './settings'

export class Orb {
  public color = faker.color.human()
  public locX = faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_WIDTH })
  public locY = faker.number.int({ min: 0, max: GAME_SETTINGS.MAP_HEIGHT })
  public radius = 5
}
