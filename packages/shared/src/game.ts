import { GameSettings } from '.'
import { Orb } from './orb'
import { Player } from './player'

export type Game = {
  orbs: Record<string, Orb>
  players: Record<string, Player>
  settings: GameSettings
}
