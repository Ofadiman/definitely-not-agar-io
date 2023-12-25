import { FC, PropsWithChildren, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { faker } from '@faker-js/faker'
import { DialogActions, Typography } from '@mui/material'

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [username, setUsername] = useState(faker.person.firstName())
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(true)
  const [isGameActionModalOpen, setIsGameActionModalOpen] = useState(false)

  const context = canvasRef.current?.getContext('2d')

  return (
    <>
      <canvas ref={canvasRef} style={{ flexGrow: 1 }}></canvas>
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
          <DialogContentText>
            <Typography sx={{ marginBottom: 2 }} variant="h4">
              Hello, {username}!
            </Typography>
            <Button variant="contained" color="success" fullWidth style={{ marginBottom: '10px' }}>
              Join a Team!
            </Button>
            <Button variant="contained" color="primary" fullWidth style={{ marginBottom: '10px' }}>
              Play Solo!
            </Button>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              style={{ marginBottom: '10px' }}
            >
              See your stats
            </Button>
            <Button variant="contained" color="error" fullWidth style={{ marginBottom: '10px' }}>
              See all stats
            </Button>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <HowToPlay />
        </DialogActions>
      </Dialog>
    </>
  )
}

export default App

function HowToPlay() {
  return (
    <ul>
      <DialogContentText component="li">
        Move your mouse on the screen to move your character.
      </DialogContentText>
      <DialogContentText component="li">
        Absorb orbs by running over them in order to grow your character.
      </DialogContentText>
      <DialogContentText component="li">The larger you get the slower you are.</DialogContentText>
      <DialogContentText component="li">
        Objective: Absorb other players to get even larger but not lose speed.
      </DialogContentText>
      <DialogContentText component="li">
        The larger player absorbs the smaller player.
      </DialogContentText>
    </ul>
  )
}
