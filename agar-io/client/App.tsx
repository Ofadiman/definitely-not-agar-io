import { useEffect, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { faker } from '@faker-js/faker'
import { DialogActions } from '@mui/material'
import { grey } from '@mui/material/colors'
import { Socket, io } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '../shared/types'
import { Orb } from '../shared/orb'
import { Player } from '../shared/player'
import { z } from 'zod'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const STARTING_ANGLE = 0
const ENDING_ANGLE = 2 * Math.PI

export const usernameFormSchema = z.object({
  username: z.string().min(3).max(20),
})

export type UsernameForm = z.infer<typeof usernameFormSchema>

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000/')

export const App = () => {
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(true)
  const { register, handleSubmit, formState } = useForm<UsernameForm>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      username: faker.person.firstName(),
    },
  })

  const onSubmit: SubmitHandler<UsernameForm> = (data) => {
    setIsUsernameModalOpen(false)
    console.log(data)
  }

  const animationFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const playerRef = useRef<Player | null>(null)
  const orbsRef = useRef<Orb[]>([])

  const draw = () => {
    if (canvasRef.current === null || canvasRef.current === undefined) {
      console.error('canvasRef.current is null or undefined')
      return
    }
    const context = canvasRef.current.getContext('2d')
    if (context === undefined || context === null) {
      console.error('canvasRef.current.getContext("2d") is null or undefined')
      return
    }
    if (playerRef.current === null) {
      console.error('playerRef.current is null')
      return
    }

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    context.translate(
      -playerRef.current.state.data.locX + canvasRef.current.width / 2,
      -playerRef.current.state.data.locY + canvasRef.current.height / 2,
    )

    context.beginPath()
    context.arc(
      playerRef.current.state.data.locX,
      playerRef.current.state.data.locY,
      playerRef.current.state.data.radius,
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

    animationFrameRef.current = requestAnimationFrame(draw)
  }

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => {
      console.log('socket connected')
      console.log('socket.id after connect', socket.id)
    })

    socket.on('initServer', (data) => {
      orbsRef.current = data.orbs
      playerRef.current = data.player

      setInterval(() => {
        if (playerRef.current === null) {
          return
        }

        socket.emit('tock', {
          xVector: playerRef.current.state.config.xVector,
          yVector: playerRef.current.state.config.yVector,
        })
      }, 1000 / 33)

      draw()
    })

    socket.on('tick', (players) => {
      const username = 'todo'
      const player = players.find((player) => player.state.data.name === username)
      if (player === undefined) {
        console.log(`player with username: ${username} not found`)
        return
      }
      playerRef.current = player
    })

    socket.on('orbSwitch', (data) => {
      orbsRef.current.splice(data.orbIndex, 1, data.newOrb)
    })

    socket.on('playerAbsorbed', (data) => {
      console.log(data)
    })

    return () => {
      socket.disconnect()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
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

          if (playerRef.current === null) {
            return
          }

          playerRef.current.state.config.xVector = xVector
          playerRef.current.state.config.yVector = yVector
        }}
        ref={canvasRef}
        style={{
          background: 'black',
          display: 'block',
          width: window.innerWidth,
          height: window.innerHeight,
        }}
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>

      <Dialog open={isUsernameModalOpen}>
        <DialogTitle>Definitely not agar.io</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              error={formState.errors.username !== undefined}
              autoFocus
              margin="dense"
              label="Username"
              type="text"
              fullWidth
              variant="outlined"
              style={{ marginBottom: '10px' }}
              helperText={formState.errors.username?.message}
              {...register('username')}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              style={{ marginBottom: '10px' }}
            >
              Play
            </Button>
          </form>
        </DialogContent>
        <DialogActions>
          <ul>
            <DialogContentText component="li">
              Move your mouse on the screen to move your character.
            </DialogContentText>
            <DialogContentText component="li">
              Absorb orbs by running over them in order to grow your character.
            </DialogContentText>
            <DialogContentText component="li">
              The larger you get the slower you are.
            </DialogContentText>
            <DialogContentText component="li">
              Objective: Absorb other players to get even larger but not lose speed.
            </DialogContentText>
            <DialogContentText component="li">
              The larger player absorbs the smaller player.
            </DialogContentText>
          </ul>
        </DialogActions>
      </Dialog>
    </>
  )
}
