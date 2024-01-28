import { GAME_SETTINGS } from 'shared'
import { grey } from '@mui/material/colors'

export const STARTING_ANGLE = 0
export const ENDING_ANGLE = 2 * Math.PI

export const drawPosition = (
  context: CanvasRenderingContext2D,
  position: { x: number; y: number },
) => {
  const fontSize = 12
  const text = `x: ${Math.floor(position.x)}, y: ${Math.floor(position.y)}`
  const textWidth = context.measureText(text).width
  const positionY = position.y - fontSize * 1.5
  context.font = `italic bold ${fontSize}px Arial`
  context.textAlign = 'center'
  context.fillText(text, position.x, positionY, textWidth)
}

export const drawGrid = (context: CanvasRenderingContext2D) => {
  const SQUARE_SIZE = 25

  context.strokeStyle = 'lightgrey'
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
}

export const drawCenter = (context: CanvasRenderingContext2D) => {
  const CENTER_RADIUS = 10
  context.beginPath()
  context.arc(
    GAME_SETTINGS.MAP_WIDTH / 2,
    GAME_SETTINGS.MAP_HEIGHT / 2,
    CENTER_RADIUS,
    STARTING_ANGLE,
    ENDING_ANGLE,
  )
  context.fillStyle = 'black'
  context.fill()

  context.strokeStyle = grey[300]
  context.lineWidth = 1
  context.stroke()

  context.closePath()
}
