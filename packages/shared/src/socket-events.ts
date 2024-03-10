import { GameSettings } from '.'
import { OrbSnapshot } from './orb'
import { PlayerSnapshot } from './player'

export type ServerToClientEvents = {
  game_state: (data: {
    settings: GameSettings
    orbs: Record<string, OrbSnapshot>
    players: Record<string, PlayerSnapshot>
  }) => void
  game_tick: (data: Record<string, PlayerSnapshot>) => void
  consume_orb: (data: OrbSnapshot) => void
  consume_player: (data: { consumedPlayerId: string; consumedById: string }) => void
}

export type ClientToServerEvents = {
  join_game: (data: { name: string }) => void
  update_player_vector: (data: { x: number; y: number }) => void
}

export type InterServerEvents = {}

export type SocketData = {}
