import { Player, Orb } from 'shared'

export const checkForOrbCollisions = (player: Player, orbs: Record<string, Orb>) => {
  let result = null
  Object.values(orbs).forEach((orb) => {
    // Performance optimization: First check if squares overlap, because its faster, then check if circles overlap
    if (
      player.location.x + player.size + orb.size > orb.location.x &&
      player.location.x < orb.location.x + player.size + orb.size &&
      player.location.y + player.size + orb.size > orb.location.y &&
      player.location.y < orb.location.y + player.size + orb.size
    ) {
      const distance = Math.sqrt(
        (player.location.x - orb.location.x) * (player.location.x - orb.location.x) +
          (player.location.y - orb.location.y) * (player.location.y - orb.location.y),
      )
      if (distance < player.size + orb.size) {
        player.score += 1
        player.absorbedOrbsCount += 1
        // if (player.zoom > 1) {
        //   player.zoom -= 0.001
        // }

        player.size += 0.05
        // if (player.speed < -0.005) {
        //   player.speed += 0.005
        // } else if (player.speed > 0.005) {
        //   player.speed -= 0.005
        // }

        result = orb.id
      }
    }
  })

  return result
}

export const checkForPlayerCollisions = (player: Player, players: Record<string, Player>) => {
  let result = null
  Object.values(players).forEach((otherPlayer) => {
    // Performance optimization: First check if squares overlap, because its faster, then check if circles overlap
    if (
      player.location.x + player.size + otherPlayer.size > otherPlayer.location.x &&
      player.location.x < otherPlayer.location.x + player.size + otherPlayer.size &&
      player.location.y + player.size + otherPlayer.size > otherPlayer.location.y &&
      player.location.y < otherPlayer.location.y + player.size + otherPlayer.size
    ) {
      const distance = Math.sqrt(
        (player.location.x - otherPlayer.location.x) *
          (player.location.x - otherPlayer.location.x) +
          (player.location.y - otherPlayer.location.y) *
            (player.location.y - otherPlayer.location.y),
      )
      if (distance < player.size + otherPlayer.size) {
        if (player.score > otherPlayer.score) {
          player.score += otherPlayer.score
          player.absorbedPlayersCount += 1
          player.size += 0.05
          result = otherPlayer.socketId
        }
        // if (player.zoom > 1) {
        //   player.zoom -= 0.001
        // }

        // if (player.speed < -0.005) {
        //   player.speed += 0.005
        // } else if (player.speed > 0.005) {
        //   player.speed -= 0.005
        // }
      }
    }
  })

  return result
}
