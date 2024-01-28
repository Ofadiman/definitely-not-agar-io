import { useCallback, useEffect, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { faker } from '@faker-js/faker'
import { DialogActions, Snackbar } from '@mui/material'
import { grey } from '@mui/material/colors'
import { Socket, io } from 'socket.io-client'
import {
  Player,
  ClientToServerEvents,
  ServerToClientEvents,
  PlayerForm,
  playerFormSchema,
  Game,
} from 'shared'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ENDING_ANGLE, STARTING_ANGLE, drawCenter, drawGrid, drawPosition } from './canvas-utils'

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000/')

export const App = () => {
  const [notifications, setNotifications] = useState<Record<string, string>>({})
  const gameRef = useRef<Game | null>(null)
  const gameIntervalIdRef = useRef<number | null>(null)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(true)
  const { register, handleSubmit, formState, getValues } = useForm<PlayerForm>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: faker.person.firstName(),
    },
  })
  const animationFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const onSubmit: SubmitHandler<PlayerForm> = (data) => {
    setIsUsernameModalOpen(false)
    socket.emit('joinGame', { name: data.name })
  }

  const draw = useCallback(() => {
    if (canvasRef.current === null) {
      console.error('canvasRef.current is null in draw()')
      return
    }
    if (canvasRef.current === undefined) {
      console.error('canvasRef.current is undefined in draw()')
      return
    }
    if (gameRef.current === null) {
      console.error('gameRef.current is null in draw()')
      return
    }

    const context = canvasRef.current.getContext('2d')
    if (context === null) {
      console.error('canvasRef.current.getContext("2d") is null in draw()')
      return
    }

    const player = gameRef.current.players[socket.id]
    if (player === undefined) {
      console.error('player is undefined in draw()')
      return
    }

    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    context.translate(
      -player.location.x + canvasRef.current.width / 2,
      -player.location.y + canvasRef.current.height / 2,
    )

    drawGrid(context)
    drawCenter(context)
    drawPosition(context, player.location)

    Object.values(gameRef.current.players).forEach((player) => {
      if (player.isAlive === false) {
        return
      }

      context.beginPath()
      context.arc(player.location.x, player.location.y, player.size, STARTING_ANGLE, ENDING_ANGLE)
      context.fillStyle = player.color
      context.fill()

      context.strokeStyle = grey[300]
      context.lineWidth = 1
      context.stroke()

      context.closePath()
    })

    Object.values(gameRef.current.orbs).forEach((orb) => {
      context.beginPath()
      context.arc(orb.location.x, orb.location.y, orb.size, STARTING_ANGLE, ENDING_ANGLE)
      context.fillStyle = orb.color
      context.fill()
      context.closePath()
    })

    animationFrameRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('connect', () => {
      console.log(`socket connected, socket.id: ${socket.id}`)

      // TODO: this code automatically joins a game and should be deleted later
      console.log(`joining game as ${getValues().name}`)
      socket.emit('joinGame', { name: getValues().name })
      setIsUsernameModalOpen(false)
    })

    socket.on('gameState', (data) => {
      gameRef.current = data
      console.log('current game state', data)

      const interval = setInterval(() => {
        if (gameRef.current === null) {
          console.error('gameRef.current is null in game loop (setInterval)')
          return
        }

        const player = gameRef.current.players[socket.id]
        if (!player) {
          console.error('player is undefined in game loop (setInterval)')
          return
        }

        socket.emit('tock', {
          x: player.vector.x,
          y: player.vector.y,
        })
      }, 1000 / 33)

      gameIntervalIdRef.current = interval as any as number

      draw()
    })

    socket.on('tick', (players) => {
      if (gameRef.current === null) {
        return
      }

      console.log('players', players)
      gameRef.current.players = players
    })

    socket.on('orbConsumed', (data) => {
      if (gameRef.current === null) {
        return
      }

      delete gameRef.current.orbs[data.consumedOrbId]

      gameRef.current.orbs[data.newOrb.id] = data.newOrb
    })

    socket.on('playerConsumed', (data) => {
      if (!gameRef.current) {
        return
      }

      if (data.consumedPlayerId === socket.id) {
        setNotifications((prev) => {
          return {
            ...prev,
            [`${Math.random()}`]: `You have been consumed by ${data.consumedById} player!`,
          }
        })
      } else if (data.consumedById === socket.id) {
        setNotifications((prev) => {
          return {
            ...prev,
            [`${Math.random()}`]: `You have consumed ${data.consumedPlayerId} player!`,
          }
        })
      } else {
        setNotifications((prev) => {
          return {
            ...prev,
            [`${Math.random()}`]: `Player ${data.consumedPlayerId} was consumed by player ${data.consumedById}!`,
          }
        })
      }

      gameRef.current.players[data.consumedPlayerId].isAlive = false
    })

    return () => {
      socket.disconnect()

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (gameIntervalIdRef.current) {
        clearInterval(gameIntervalIdRef.current)
      }
    }
  }, [])

  return (
    <>
      <canvas
        onMouseMove={(event) => {
          if (
            gameRef.current === null ||
            canvasRef.current === null ||
            canvasRef.current === undefined
          ) {
            return
          }
          const context = canvasRef.current.getContext('2d')
          if (context === undefined || context === null) {
            return
          }

          const angleDeg =
            (Math.atan2(
              event.clientY - canvasRef.current.height / 2,
              event.clientX - canvasRef.current.width / 2,
            ) *
              180) /
            Math.PI

          const vector: Player['vector'] = {
            x: 0,
            y: 0,
          }
          if (angleDeg >= 0 && angleDeg < 90) {
            vector.x = 1 - angleDeg / 90
            vector.y = -(angleDeg / 90)
          } else if (angleDeg >= 90 && angleDeg <= 180) {
            vector.x = -(angleDeg - 90) / 90
            vector.y = -(1 - (angleDeg - 90) / 90)
          } else if (angleDeg >= -180 && angleDeg < -90) {
            vector.x = (angleDeg + 90) / 90
            vector.y = 1 + (angleDeg + 90) / 90
          } else if (angleDeg < 0 && angleDeg >= -90) {
            vector.x = (angleDeg + 90) / 90
            vector.y = 1 - (angleDeg + 90) / 90
          }

          const player = gameRef.current.players[socket.id]
          if (!player) {
            console.error(`there is no player with id: ${socket.id} in the game`)
            return
          }

          player.vector = vector
        }}
        ref={canvasRef}
        style={{
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
              error={formState.errors.name !== undefined}
              autoFocus
              margin="dense"
              label="Username"
              type="text"
              fullWidth
              variant="outlined"
              style={{ marginBottom: '10px' }}
              helperText={formState.errors.name?.message}
              {...register('name')}
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

      {Object.entries(notifications).map(([id, text]) => {
        return (
          <Snackbar
            key={id}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={notifications[id] !== undefined}
            onClose={() => {
              setNotifications((prev) => {
                const copy = { ...prev }
                delete prev[id]
                return copy
              })
            }}
            message={text}
            autoHideDuration={5000}
          />
        )
      })}
    </>
  )
}
