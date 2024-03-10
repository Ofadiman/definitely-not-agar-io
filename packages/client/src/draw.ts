import { GameSettings, Orb, Player } from 'shared'

export const STARTING_ANGLE = 0
export const ENDING_ANGLE = 2 * Math.PI

const grid = (context: CanvasRenderingContext2D, gameSettings: GameSettings) => {
  context.save()

  const SQUARE_SIZE = 25

  context.strokeStyle = '#e5e7eb'
  context.beginPath()

  for (let x = 0; x <= gameSettings.map.width; x += SQUARE_SIZE) {
    context.moveTo(x, 0)
    context.lineTo(x, gameSettings.map.height)
  }
  for (let y = 0; y <= gameSettings.map.height; y += SQUARE_SIZE) {
    context.moveTo(0, y)
    context.lineTo(gameSettings.map.width, y)
  }
  context.stroke()

  context.restore()
}

export const center = (context: CanvasRenderingContext2D, gameSettings: GameSettings) => {
  context.save()

  const RADIUS = 10
  context.beginPath()
  context.arc(
    gameSettings.map.width / 2,
    gameSettings.map.height / 2,
    RADIUS,
    STARTING_ANGLE,
    ENDING_ANGLE,
  )
  context.fillStyle = 'black'
  context.fill()

  context.strokeStyle = '#d1d5db'
  context.lineWidth = 1
  context.stroke()

  context.closePath()

  context.restore()
}

const player = (context: CanvasRenderingContext2D, player: Player, gameSettings: GameSettings) => {
  if (player.isDead()) {
    return
  }

  context.save()

  context.beginPath()
  context.arc(
    player.snapshot.location.x,
    player.snapshot.location.y,
    player.radius(gameSettings),
    STARTING_ANGLE,
    ENDING_ANGLE,
  )
  context.fillStyle = player.snapshot.color
  context.fill()
  context.strokeStyle = '#9ca3af'
  context.lineWidth = 0.5
  context.stroke()
  context.closePath()

  context.restore()

  context.save()

  const fontSize = 20
  const text = `x: ${Math.floor(player.snapshot.location.x)}, y: ${Math.floor(
    player.snapshot.location.y,
  )}`
  context.font = `bold ${fontSize}px Roboto`
  context.textAlign = 'center'
  context.fillText(
    text,
    player.snapshot.location.x,
    player.snapshot.location.y - fontSize / 2 - player.radius(gameSettings),
  )

  context.restore()
}

const orb = (context: CanvasRenderingContext2D, orb: Orb, gameSettings: GameSettings) => {
  context.save()

  context.beginPath()
  context.arc(
    orb.snapshot.location.x,
    orb.snapshot.location.y,
    gameSettings.orbRadius,
    STARTING_ANGLE,
    ENDING_ANGLE,
  )
  context.fillStyle = orb.snapshot.color
  context.fill()
  context.closePath()

  context.restore()
}

export const draw = {
  player,
  center,
  orb,
  grid,
}
