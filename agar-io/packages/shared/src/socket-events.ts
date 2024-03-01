import { Game } from './game'
import { Orb } from './orb'
import { Player } from './player'

export type ServerToClientEvents = {
  game_state: (data: Game) => void
  game_tick: (data: Record<string, Player>) => void
  consume_orb: (data: { consumedOrbId: string; newOrb: Orb }) => void
  consume_player: (data: { consumedPlayerId: string; consumedById: string }) => void
}

export type ClientToServerEvents = {
  join_game: (data: { name: string }) => void
  update_player_vector: (data: { x: number; y: number }) => void
}

export type InterServerEvents = {}

export type SocketData = {}
