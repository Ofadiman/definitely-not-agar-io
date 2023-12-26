import { Orb } from './orb'
import { Player } from './player'

export type ServerToClientEvents = {
  initServer: (data: { orbs: Orb[]; player: Player }) => void
  tick: (data: Player[]) => void
  orbSwitch: (data: { orbIndex: number; newOrb: Orb }) => void
  playerAbsorbed: (data: { absorbed: string; absorbedBy: string }) => void
}

export type ClientToServerEvents = {
  initClient: (username: string) => void
  tock: (data: { xVector: number; yVector: number }) => void
}

export type InterServerEvents = {}

export type SocketData = {}
