import { useLayoutEffect, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { faker } from '@faker-js/faker'
import { DialogActions } from '@mui/material'
import { HowToPlay } from './HowToPlay'

const CIRCLE_RADIUS = 5
const STARTING_ANGLE = 0
const ENDING_ANGLE = 2 * Math.PI

const draw = (context: CanvasRenderingContext2D) => {
  const x = faker.number.int({ min: 0, max: 500 })
  const y = faker.number.int({ min: 0, max: 500 })
  console.log({ x, y })

  context.beginPath()
  context.arc(x, y, CIRCLE_RADIUS, STARTING_ANGLE, ENDING_ANGLE)
  context.fillStyle = 'red'
  context.fill()

  context.strokeStyle = 'green'
  context.lineWidth = 3
  context.stroke()
  context.closePath()
}

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [username, setUsername] = useState(faker.person.firstName())
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const [isGameActionModalOpen, setIsGameActionModalOpen] = useState(false)

  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (context === undefined || context === null) {
      return
    }

    draw(context)
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: window.innerWidth, height: window.innerHeight }}
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>
      <Dialog open={isUsernameModalOpen}>
        <DialogTitle>Agar Clone</DialogTitle>
        <DialogContent dividers>
          <Button
            onClick={() => {
              console.log('login with github')
            }}
            variant="contained"
            fullWidth
            style={{ marginBottom: '10px' }}
          >
            Login with github
          </Button>
          <Button
            onClick={() => {
              setIsUsernameModalOpen(false)
              setIsGameActionModalOpen(true)
            }}
            variant="contained"
            color="secondary"
            fullWidth
            style={{ marginBottom: '10px' }}
          >
            Play as guest
          </Button>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Guest name"
            type="text"
            fullWidth
            variant="outlined"
            defaultValue={username}
            style={{ marginBottom: '10px' }}
            onChange={(event) => {
              setUsername(event.currentTarget.value)
            }}
          />
        </DialogContent>
        <DialogActions>
          <HowToPlay />
        </DialogActions>
      </Dialog>

      <Dialog open={isGameActionModalOpen}>
        <DialogTitle>Agar Clone</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ marginBottom: 2 }} variant="h4">
            Hello, {username}!
          </DialogContentText>
          <Button variant="contained" color="success" fullWidth style={{ marginBottom: '10px' }}>
            Join a Team!
          </Button>
          <Button
            onClick={() => {
              setIsGameActionModalOpen(false)
            }}
            variant="contained"
            color="primary"
            fullWidth
            style={{ marginBottom: '10px' }}
          >
            Play Solo!
          </Button>
          <Button variant="contained" color="secondary" fullWidth style={{ marginBottom: '10px' }}>
            See your stats
          </Button>
          <Button variant="contained" color="error" fullWidth style={{ marginBottom: '10px' }}>
            See all stats
          </Button>
        </DialogContent>
        <DialogActions>
          <HowToPlay />
        </DialogActions>
      </Dialog>
    </>
  )
}
