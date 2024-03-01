import { GAME_SETTINGS, Orb, Player } from 'shared'
import { grey } from '@mui/material/colors'

export const STARTING_ANGLE = 0
export const ENDING_ANGLE = 2 * Math.PI

const position = (
  context: CanvasRenderingContext2D,
  position: { x: number; y: number; radius: number },
) => {
  context.save()

  const fontSize = 20
  const text = `x: ${Math.floor(position.x)}, y: ${Math.floor(position.y)}`
  context.font = `bold ${fontSize}px Roboto`
  context.textAlign = 'center'
  context.fillText(text, position.x, position.y - fontSize - Math.round(position.radius / 2))

  context.restore()
}

const grid = (context: CanvasRenderingContext2D) => {
  context.save()

  const SQUARE_SIZE = 25

  context.strokeStyle = grey[200]
  context.beginPath()

  for (let x = 0; x <= GAME_SETTINGS.MAP_WIDTH; x += SQUARE_SIZE) {
    context.moveTo(x, 0)
    context.lineTo(x, GAME_SETTINGS.MAP_HEIGHT)
  }
  for (let y = 0; y <= GAME_SETTINGS.MAP_HEIGHT; y += SQUARE_SIZE) {
    context.moveTo(0, y)
    context.lineTo(GAME_SETTINGS.MAP_WIDTH, y)
  }
  context.stroke()

  context.restore()
}

export const center = (context: CanvasRenderingContext2D) => {
  context.save()

  const RADIUS = 10
  context.beginPath()
  context.arc(
    GAME_SETTINGS.MAP_WIDTH / 2,
    GAME_SETTINGS.MAP_HEIGHT / 2,
    RADIUS,
    STARTING_ANGLE,
    ENDING_ANGLE,
  )
  context.fillStyle = 'black'
  context.fill()

  context.strokeStyle = grey[300]
  context.lineWidth = 1
  context.stroke()

  context.closePath()

  context.restore()
}

const player = (context: CanvasRenderingContext2D, player: Player) => {
  if (player instanceof Player === false) {
    console.log(player)
  }
  context.save()

  context.beginPath()
  context.arc(
    player.snapshot.location.x,
    player.snapshot.location.y,
    player.radius(),
    STARTING_ANGLE,
    ENDING_ANGLE,
  )
  context.fillStyle = player.snapshot.color
  context.fill()

  context.strokeStyle = grey[400]
  context.lineWidth = 1
  context.stroke()

  context.closePath()

  context.restore()
}

const orb = (context: CanvasRenderingContext2D, orb: Orb) => {
  context.save()

  context.beginPath()
  context.arc(orb.location.x, orb.location.y, orb.radius, STARTING_ANGLE, ENDING_ANGLE)
  context.fillStyle = orb.color
  context.fill()
  context.closePath()

  context.restore()
}

export const draw = {
  player,
  center,
  orb,
  grid,
  position,
}
