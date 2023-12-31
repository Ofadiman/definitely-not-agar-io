import { Player, PlayerConfig, PlayerData, Orb } from 'shared'

export const checkForOrbCollisions = (pData: PlayerData, pConfig: PlayerConfig, orbs: Orb[]) => {
  for (let i = 0; i < orbs.length; i++) {
    const orb = orbs[i]
    if (orb === undefined) {
      return
    }
    // Performance optimization: First check if squares overlap, because its faster, then check if circles overlap
    if (
      pData.locX + pData.radius + orb.radius > orb.locX &&
      pData.locX < orb.locX + pData.radius + orb.radius &&
      pData.locY + pData.radius + orb.radius > orb.locY &&
      pData.locY < orb.locY + pData.radius + orb.radius
    ) {
      const distance = Math.sqrt(
        (pData.locX - orb.locX) * (pData.locX - orb.locX) +
          (pData.locY - orb.locY) * (pData.locY - orb.locY),
      )
      if (distance < pData.radius + orb.radius) {
        pData.score += 1
        pData.absorbOrbsCount += 1
        if (pConfig.zoom > 1) {
          pConfig.zoom -= 0.001
        }
        pData.radius += 0.05
        if (pConfig.speed < -0.005) {
          pConfig.speed += 0.005
        } else if (pConfig.speed > 0.005) {
          pConfig.speed -= 0.005
        }
        return i
      }
    }
  }
  return null
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
