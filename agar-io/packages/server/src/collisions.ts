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
        if (player.zoom > 1) {
          player.zoom -= 0.001
        }

        player.size += 0.05
        if (player.speed < -0.005) {
          player.speed += 0.005
        } else if (player.speed > 0.005) {
          player.speed -= 0.005
        }

        result = orb.id
      }
    }
  })

  return result
}

export const checkForPlayerCollisions = (
  pData: PlayerData,
  pConfig: PlayerConfig,
  players: Player[],
  playerId: string,
) => {
  for (let i = 0; i < players.length; i++) {
    const p = players[i]
    if (p === undefined) {
      return
    }
    if (p.state.socketId && p.state.socketId !== playerId) {
      let pLocx = p.state.data.locX
      let pLocy = p.state.data.locY
      let pR = p.state.data.radius
      if (
        pData.locX + pData.radius + pR > pLocx &&
        pData.locX < pLocx + pData.radius + pR &&
        pData.locY + pData.radius + pR > pLocy &&
        pData.locY < pLocy + pData.radius + pR
      ) {
        const distance = Math.sqrt(
          (pData.locX - pLocx) * (pData.locX - pLocx) + (pData.locY - pLocy) * (pData.locY - pLocy),
        )
        if (distance < pData.radius + pR) {
          if (pData.radius > pR) {
            pData.score += p.state.data.score + 10
            pData.absorbOrbsCount += 1
            p.state.isAlive = false
            pData.radius += p.state.data.radius * 0.25
            const collisionData = {
              absorbed: p.state.data.name,
              absorbedBy: pData.name,
            }

            if (pConfig.zoom > 1) {
              pConfig.zoom -= pR * 0.25 * 0.001
            }
            players.splice(i, 1)
            return collisionData
          }
        }
      }
    }
  }
  return null
}
