import { Player, Orb, Collideable, GameSettings } from 'shared'

export const isColliding = (first: Collideable, second: Collideable): boolean => {
  // Performance optimization technique by first checking overlapping squares and then performing more complicated calculations related to overlapping circles.
  if (
    first.location.x + first.radius + second.radius > second.location.x &&
    first.location.x < second.location.x + first.radius + second.radius &&
    first.location.y + first.radius + second.radius > second.location.y &&
    first.location.y < second.location.y + first.radius + second.radius
  ) {
    const distance = Math.sqrt(
      (first.location.x - second.location.x) * (first.location.x - second.location.x) +
        (first.location.y - second.location.y) * (first.location.y - second.location.y),
    )

    if (distance < first.radius + second.radius) {
      return true
    }
  }

  return false
}

export const checkForOrbCollisions = (
  player: Player,
  orbs: Record<string, Orb>,
  gameSettings: GameSettings,
) => {
  if (player.isDead()) {
    return null
  }

  const listOfOrbs = Object.values(orbs)

  for (const orb of listOfOrbs) {
    if (
      isColliding({ location: player.snapshot.location, radius: player.radius(gameSettings) }, orb)
    ) {
      // TODO: That logic should not be here.
      player.snapshot.absorbedOrbsCount++
      return orb.id
    }
  }

  return null
}

export const checkForPlayerCollisions = (
  player: Player,
  otherPlayers: Record<string, Player>,
  gameSettings: GameSettings,
) => {
  if (player.isDead()) {
    return null
  }

  const listOfOtherPlayers = Object.values(otherPlayers)

  for (const otherPlayer of listOfOtherPlayers) {
    if (otherPlayer.isDead()) {
      continue
    }

    if (
      isColliding(
        { location: player.snapshot.location, radius: player.radius(gameSettings) },
        {
          location: otherPlayer.snapshot.location,
          radius: otherPlayer.radius(gameSettings),
        },
      )
    ) {
      if (player.snapshot.absorbedOrbsCount > otherPlayer.snapshot.absorbedOrbsCount) {
        // TODO: That logic should not be here.
        player.snapshot.absorbedOrbsCount += otherPlayer.snapshot.absorbedOrbsCount
        return otherPlayer.snapshot.socketId
      }
    }
  }

  return null
}
