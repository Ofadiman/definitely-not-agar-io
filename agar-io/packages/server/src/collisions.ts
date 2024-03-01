import { Player, Orb, Collideable } from 'shared'

export const isColliding = (first: Collideable, second: Collideable): boolean => {
  // Performance optimization technique by first checking overlapping squares and then performing more complicated calculations related to overlapping circles.
  if (
    first.location.x + first.size + second.size > second.location.x &&
    first.location.x < second.location.x + first.size + second.size &&
    first.location.y + first.size + second.size > second.location.y &&
    first.location.y < second.location.y + first.size + second.size
  ) {
    const distance = Math.sqrt(
      (first.location.x - second.location.x) * (first.location.x - second.location.x) +
        (first.location.y - second.location.y) * (first.location.y - second.location.y),
    )

    if (distance < first.size + second.size) {
      return true
    }
  }

  return false
}

export const checkForOrbCollisions = (player: Player, orbs: Record<string, Orb>) => {
  const listOfOrbs = Object.values(orbs)

  for (const orb of listOfOrbs) {
    if (
      isColliding({ location: player.location, size: player.size + player.absorbedOrbsCount }, orb)
    ) {
      player.absorbedOrbsCount++
      player.score++
      return orb.id
    }
  }

  return null
}

export const checkForPlayerCollisions = (player: Player, otherPlayers: Record<string, Player>) => {
  const listOfOtherPlayers = Object.values(otherPlayers)

  for (const otherPlayer of listOfOtherPlayers) {
    if (
      isColliding(
        { location: player.location, size: player.size + player.absorbedOrbsCount },
        { location: otherPlayer.location, size: otherPlayer.size + otherPlayer.absorbedOrbsCount },
      )
    ) {
      if (player.score > otherPlayer.score) {
        player.score += otherPlayer.score
        player.absorbedPlayersCount += 1
        return otherPlayer.socketId
      }
    }
  }

  return null
}
