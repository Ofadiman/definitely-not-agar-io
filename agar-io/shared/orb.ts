import { faker } from '@faker-js/faker'

export class Orb {
  public color = faker.color.human()
  public locX = faker.number.int({ min: 0, max: 500 })
  public locY = faker.number.int({ min: 0, max: 500 })
  public radius = 5
}
