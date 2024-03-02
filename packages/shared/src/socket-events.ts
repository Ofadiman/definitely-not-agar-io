import { Orb } from './orb'
import { PlayerSnapshot } from './player'

export type ServerToClientEvents = {
  game_state: (data: { orbs: Record<string, Orb>; players: Record<string, PlayerSnapshot> }) => void
  game_tick: (data: Record<string, PlayerSnapshot>) => void
  consume_orb: (data: { consumedOrbId: string; newOrb: Orb }) => void
  consume_player: (data: { consumedPlayerId: string; consumedById: string }) => void
}

export type ClientToServerEvents = {
  join_game: (data: { name: string }) => void
  update_player_vector: (data: { x: number; y: number }) => void
}

export type InterServerEvents = {}

export type SocketData = {}
