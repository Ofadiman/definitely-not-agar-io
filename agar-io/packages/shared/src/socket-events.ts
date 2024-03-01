import { Game } from './game'
import { Orb } from './orb'
import { Player } from './player'

export type ServerToClientEvents = {
  gameState: (data: Game) => void
  tick: (data: Record<string, Player>) => void
  orbConsumed: (data: { consumedOrbId: string; newOrb: Orb }) => void
  playerConsumed: (data: { consumedPlayerId: string; consumedById: string }) => void
}

export type ClientToServerEvents = {
  joinGame: (data: { name: string }) => void
  tock: (data: { x: number; y: number }) => void
}

export type InterServerEvents = {}

export type SocketData = {}
