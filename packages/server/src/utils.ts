import { A, D } from '@mobily/ts-belt'
import { Game, Player } from 'shared'

export const drawWinner = (game: Game): Player | null => {
  const winner = A.find(
    D.values(game.players),
    (player) => player.snapshot.absorbedOrbsCount > game.settings.winCondition,
  )

  if (winner) {
    return winner
  }

  return null
}
