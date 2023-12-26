import { Orb } from './orb'
import { Player } from './player'

export type ServerToClientEvents = {
  initServer: (data: { orbs: Orb[]; player: Player }) => void
  tick: (data: Player[]) => void
}

export type ClientToServerEvents = {
  initClient: (username: string) => void
  tock: (data: { xVector: number; yVector: number }) => void
}

export type InterServerEvents = {}

export type SocketData = {}
