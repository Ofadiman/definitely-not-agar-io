import { faker } from '@faker-js/faker'
import { Collideable } from './utils'
import { GameSettings } from '.'

export type Orb = {
  id: string
  color: string
} & Collideable

export const createOrb = (gameSettings: GameSettings): Orb => {
  return {
    id: faker.string.uuid(),
    location: {
      x: faker.number.int({ min: 0, max: gameSettings.MAP_WIDTH }),
      y: faker.number.int({ min: 0, max: gameSettings.MAP_HEIGHT }),
    },
    radius: gameSettings.ORB_RADIUS,
    color: faker.color.human(),
  }
}
