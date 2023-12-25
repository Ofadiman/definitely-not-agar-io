import { Orb } from './orb'
import { Player } from './player'

export type ServerToClientEvents = {
  initServer: (data: { orbs: Orb[]; player: Player }) => void
}

export type ClientToServerEvents = {
  initClient: (username: string) => void
}

export type InterServerEvents = {}

export type SocketData = {}
