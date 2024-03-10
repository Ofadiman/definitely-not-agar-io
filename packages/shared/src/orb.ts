import { faker } from '@faker-js/faker'
import { GameSettings } from '.'

export type OrbSnapshot = {
  id: string
  color: string
  location: {
    x: number
    y: number
  }
}

export class Orb {
  snapshot: OrbSnapshot

  private constructor(snapshot: OrbSnapshot) {
    this.snapshot = snapshot
  }

  static fromSnapshot(snapshot: OrbSnapshot): Orb {
    return new Orb(snapshot)
  }

  static toSnapshot(orb: Orb): OrbSnapshot {
    return orb.snapshot
  }

  static new(args: { gameSettings: GameSettings }): Orb {
    return new Orb({
      id: faker.string.uuid(),
      location: {
        x: faker.number.int({ min: 0, max: args.gameSettings.map.width }),
        y: faker.number.int({ min: 0, max: args.gameSettings.map.height }),
      },
      color: faker.color.human(),
    })
  }
}
