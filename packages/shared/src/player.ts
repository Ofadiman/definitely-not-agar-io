import { faker } from '@faker-js/faker'
import { GameSettings } from '.'

export type PlayerSnapshot = {
  id: string
  socketId: string
  type: 'human' | 'bot'
  state: 'alive' | 'dead'
  username: string
  color: string
  absorbedOrbsCount: number
  absorbedPlayersCount: number
  vector: {
    x: number
    y: number
  }
  location: {
    x: number
    y: number
  }
}

export class Player {
  snapshot: PlayerSnapshot

  private constructor(snapshot: PlayerSnapshot) {
    this.snapshot = snapshot
  }

  static fromSnapshot(snapshot: PlayerSnapshot): Player {
    return new Player(snapshot)
  }

  static toSnapshot(player: Player): PlayerSnapshot {
    return player.snapshot
  }

  static new(args: {
    type: PlayerSnapshot['type']
    username: string
    socketId: string
    gameSettings: GameSettings
  }): Player {
    const vectorX = faker.number.float({ min: -1, max: 1 }) * faker.helpers.arrayElement([-1, 1])
    const vectorY = (1 - Math.abs(vectorX)) * faker.helpers.arrayElement([-1, 1])

    return new Player({
      id: faker.string.uuid(),
      type: args.type,
      state: 'alive',
      color: faker.color.human(),
      location: {
        x: faker.number.int({ min: 0, max: args.gameSettings.map.width }),
        y: faker.number.int({ min: 0, max: args.gameSettings.map.height }),
      },
      username: args.username,
      vector: {
        x: vectorX,
        y: vectorY,
      },
      socketId: args.socketId,
      absorbedOrbsCount: 0,
      absorbedPlayersCount: 0,
    })
  }

  radius(gameSettings: GameSettings): number {
    const surface =
      Math.pow(gameSettings.initialPlayerRadius, 2) * Math.PI +
      this.snapshot.absorbedOrbsCount * Math.pow(gameSettings.orbRadius, 2) * Math.PI

    const radius = Math.sqrt(surface / Math.PI)

    return radius
  }

  isBot(): boolean {
    return this.snapshot.type === 'bot'
  }

  isHuman(): boolean {
    return this.snapshot.type === 'human'
  }

  isAlive(): boolean {
    return this.snapshot.state === 'alive'
  }

  isDead(): boolean {
    return this.snapshot.state === 'dead'
  }

  move(gameSettings: GameSettings): void {
    // TODO: Replace "1" with calculated player speed.
    this.snapshot.location.x += 1 * this.snapshot.vector.x
    if (this.snapshot.location.x - this.radius(gameSettings) < 0 && this.snapshot.vector.x < 0) {
      this.snapshot.location.x = 0 + this.radius(gameSettings)
    }
    if (
      this.snapshot.location.x + this.radius(gameSettings) > gameSettings.map.width &&
      this.snapshot.vector.x > 0
    ) {
      this.snapshot.location.x = gameSettings.map.width - this.radius(gameSettings)
    }

    // TODO: Replace "1" with calculated this speed.
    this.snapshot.location.y -= 1 * this.snapshot.vector.y
    if (this.snapshot.location.y - this.radius(gameSettings) < 0 && this.snapshot.vector.y > 0) {
      this.snapshot.location.y = 0 + this.radius(gameSettings)
    } else if (
      this.snapshot.location.y + this.radius(gameSettings) > gameSettings.map.height &&
      this.snapshot.vector.y < 0
    ) {
      this.snapshot.location.y = gameSettings.map.height - this.radius(gameSettings)
    }
  }
}
