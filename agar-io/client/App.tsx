import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { faker } from '@faker-js/faker'
import { DialogActions } from '@mui/material'
import { HowToPlay } from './HowToPlay'
import { grey } from '@mui/material/colors'
import { Socket, io } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '../shared/types'
import { Orb } from '../shared/orb'

const CIRCLE_RADIUS = 5
const STARTING_ANGLE = 0
const ENDING_ANGLE = 2 * Math.PI
const SPEED = 3

type Player = {
  locX: number
  locY: number
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000/')

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const playerRef = useRef<Player>({
    locX: faker.number.int({ min: 0, max: window.innerWidth }),
    locY: faker.number.int({ min: 0, max: window.innerHeight }),
  })
  const orbsRef = useRef<Orb[]>([])
  const [username, setUsername] = useState(faker.person.firstName())
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false)
  const [isGameActionModalOpen, setIsGameActionModalOpen] = useState(false)

  const draw = () => {
    if (canvasRef.current === null || canvasRef.current === undefined) {
      return
    }
    const context = canvasRef.current.getContext('2d')
    if (context === undefined || context === null) {
      return
    }

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    context.translate(
      -playerRef.current.locX + canvasRef.current.width / 2,
      -playerRef.current.locY + canvasRef.current.height / 2,
    )

    context.beginPath()
    context.arc(
      playerRef.current.locX,
      playerRef.current.locY,
      CIRCLE_RADIUS,
      STARTING_ANGLE,
      ENDING_ANGLE,
    )
    context.fillStyle = 'red'
    context.fill()

    context.strokeStyle = grey[300]
    context.lineWidth = 1
    context.stroke()

    context.closePath()

    orbsRef.current.forEach((orb) => {
      context.beginPath()
      context.arc(orb.locX, orb.locY, orb.radius, STARTING_ANGLE, ENDING_ANGLE)
      context.fillStyle = orb.color
      context.fill()
      context.closePath()
    })

    requestAnimationFrame(draw)
  }

  useLayoutEffect(() => {
    const requestId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(requestId)
    }
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => {
      console.log('socket connected')
    })

    socket.on('init', (data) => {
      console.log(data.orbs)
      orbsRef.current = data.orbs
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <>
      <canvas
        onMouseMove={(event) => {
          if (canvasRef.current === null || canvasRef.current === undefined) {
            return
          }
          const context = canvasRef.current.getContext('2d')
          if (context === undefined || context === null) {
            return
          }

          const mousePosition = {
            x: event.clientX,
            y: event.clientY,
          }
          const angleDeg =
            (Math.atan2(
              mousePosition.y - canvasRef.current.height / 2,
              mousePosition.x - canvasRef.current.width / 2,
            ) *
              180) /
            Math.PI

          let xVector: number = 0
          let yVector: number = 0
          if (angleDeg >= 0 && angleDeg < 90) {
            xVector = 1 - angleDeg / 90
            yVector = -(angleDeg / 90)
          } else if (angleDeg >= 90 && angleDeg <= 180) {
            xVector = -(angleDeg - 90) / 90
            yVector = -(1 - (angleDeg - 90) / 90)
          } else if (angleDeg >= -180 && angleDeg < -90) {
            xVector = (angleDeg + 90) / 90
            yVector = 1 + (angleDeg + 90) / 90
          } else if (angleDeg < 0 && angleDeg >= -90) {
            xVector = (angleDeg + 90) / 90
            yVector = 1 - (angleDeg + 90) / 90
          }

          if (
            (playerRef.current.locX < 0 && xVector < 0) ||
            (playerRef.current.locX > window.innerWidth && xVector > 0)
          ) {
            playerRef.current.locY -= SPEED * yVector
          } else if (
            (playerRef.current.locY < 0 && yVector > 0) ||
            (playerRef.current.locY > window.innerHeight && yVector < 0)
          ) {
            playerRef.current.locX += SPEED * xVector
          } else {
            playerRef.current.locX += SPEED * xVector
            playerRef.current.locY -= SPEED * yVector
          }
        }}
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
