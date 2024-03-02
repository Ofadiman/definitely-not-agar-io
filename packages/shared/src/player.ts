import { faker } from '@faker-js/faker'
import { GameSettings } from '.'

export type PlayerSnapshot = {
  id: string
  socketId: string
  type: 'human' | 'bot'
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
    return new Player({
      id: faker.string.uuid(),
      type: args.type,
      color: faker.color.human(),
      location: {
        x: faker.number.int({ min: 0, max: args.gameSettings.MAP_WIDTH }),
        y: faker.number.int({ min: 0, max: args.gameSettings.MAP_HEIGHT }),
      },
      username: args.username,
      vector: {
        x: 0,
        y: 0,
      },
      socketId: args.socketId,
      absorbedOrbsCount: 0,
      absorbedPlayersCount: 0,
    })
  }

  radius(gameSettings: GameSettings): number {
    const surface =
      Math.pow(gameSettings.INITIAL_PLAYER_RADIUS, 2) * Math.PI +
      this.snapshot.absorbedOrbsCount * Math.pow(gameSettings.ORB_RADIUS, 2) * Math.PI

    const radius = Math.sqrt(surface / Math.PI)

    return radius
  }

  isBot(): boolean {
    return this.snapshot.type === 'bot'
  }

  isHuman(): boolean {
    return this.snapshot.type === 'human'
  }
}
