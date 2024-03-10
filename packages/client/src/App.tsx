import { useCallback, useEffect, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { faker } from '@faker-js/faker'
import { DialogActions, Snackbar } from '@mui/material'
import { Socket, io } from 'socket.io-client'
import {
  ClientToServerEvents,
  ServerToClientEvents,
  PlayerForm,
  playerFormSchema,
  Game,
  loop,
  PlayerSnapshot,
  Player,
  Orb,
} from 'shared'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { draw } from './draw'
import { D } from '@mobily/ts-belt'
import { Statistics } from './Statistics'

declare global {
  interface Window {
    game?: Game
  }
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000/', {
  autoConnect: false,
})

export const App = () => {
  const [winner, setWinner] = useState<Player | null>(null)
  const [players, setPlayers] = useState<readonly Player[]>([])
  const [notification, setNotification] = useState<string | null>(null)
  const gameRef = useRef<Game | null>(null)
  const cancelGameLoopRef = useRef<Function | null>(null)
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(true)
  const { register, handleSubmit, formState } = useForm<PlayerForm>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: faker.person.firstName(),
    },
  })
  const animationFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const onSubmit: SubmitHandler<PlayerForm> = (data) => {
    setIsUsernameModalOpen(false)
    socket.emit('join_game', { name: data.name })
  }

  const drawGame = useCallback(() => {
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
      -player.snapshot.location.x + canvasRef.current.width / 2,
      -player.snapshot.location.y + canvasRef.current.height / 2,
    )

    draw.grid(context, gameRef.current.settings)

    Object.values(gameRef.current.orbs).forEach((orb) => {
      if (!gameRef.current) {
        return
      }

      draw.orb(context, orb, gameRef.current.settings)
    })

    Object.values(gameRef.current.players).forEach((player) => {
      if (!gameRef.current) {
        return
      }

      draw.player(context, player, gameRef.current.settings)
    })

    animationFrameRef.current = requestAnimationFrame(drawGame)
  }, [])

  useEffect(() => {
    socket.connect()

    socket.on('game_state', (data) => {
      const game = {
        orbs: D.map(data.orbs, (snapshot) => Orb.fromSnapshot(snapshot)),
        players: D.map(data.players, (snapshot) => Player.fromSnapshot(snapshot)),
        settings: data.settings,
      }

      gameRef.current = game
      window.game = game

      cancelGameLoopRef.current = loop({
        fps: data.settings.fps,
        callback: () => {
          if (gameRef.current === null) {
            console.error('gameRef.current is null in game loop (setInterval)')
            return
          }

          const player = gameRef.current.players[socket.id]
          if (!player) {
            return
          }

          if (player.isDead()) {
            return
          }

          socket.emit('update_player_vector', {
            x: player.snapshot.vector.x,
            y: player.snapshot.vector.y,
          })
        },
      })

      drawGame()
    })

    socket.on('game_tick', (players) => {
      if (gameRef.current === null) {
        return
      }

      gameRef.current.players = D.map(players, Player.fromSnapshot)
      setPlayers(D.values(gameRef.current.players))
    })

    socket.on('consume_orb', (data) => {
      if (gameRef.current === null) {
        return
      }

      const orb = Orb.fromSnapshot(data)
      gameRef.current.orbs[orb.snapshot.id] = orb
    })

    socket.on('consume_player', (data) => {
      if (!gameRef.current) {
        return
      }

      if (data.consumedPlayerId === socket.id) {
        setNotification(`You have been consumed by ${data.consumedById} player!`)
      } else if (data.consumedById === socket.id) {
        setNotification(`You have consumed ${data.consumedPlayerId} player!`)
      } else {
        setNotification(
          `Player ${data.consumedPlayerId} was consumed by player ${data.consumedById}!`,
        )
      }
    })

    socket.on('draw_winner', (data) => {
      if (!gameRef.current) {
        return
      }

      const winner = gameRef.current.players[data.winnerId]
      if (!winner) {
        return
      }

      if (cancelGameLoopRef.current) {
        cancelGameLoopRef.current()
      }
      setWinner(winner)
    })

    return () => {
      socket.disconnect()

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (cancelGameLoopRef.current) {
        cancelGameLoopRef.current()
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

          const vector: PlayerSnapshot['vector'] = {
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
            return
          }

          // TODO: There is a possible problem here. I think, the event for updating player vector should be sent here and the vector value should be taken from server-side state to avoid visual glitches when vectors are diffrent on the client-side vs server-side.
          player.snapshot.vector = vector
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

      <Dialog open={winner !== null}>
        <DialogTitle>Game Over</DialogTitle>
        <DialogContent>
          {winner?.snapshot.socketId === socket.id
            ? 'You won!'
            : `Player ${winner?.snapshot.username} won!`}
        </DialogContent>
      </Dialog>

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

      {gameRef.current && (
        <div
          key={JSON.stringify(gameRef.current.players)}
          style={{ position: 'absolute', right: 10, top: 10 }}
        >
          <Statistics players={players} />
        </div>
      )}

      {notification && (
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={notification !== null}
          onClose={() => {
            setNotification(null)
          }}
          message={notification}
          autoHideDuration={3000}
        />
      )}
    </>
  )
}
