import { faker } from '@faker-js/faker'
import { Collideable } from './utils'
import { GAME_SETTINGS } from '.'

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
    radius: GAME_SETTINGS.ORB_RADIUS,
    color: faker.color.human(),
  }
}
