import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { AppBar, Avatar, Box, Button, IconButton, Paper, Toolbar, Typography } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'

type Namespace = {
  imageSrc: string
  name: string
}

export const socket = io('http://localhost:3000', {
  autoConnect: false,
})

export const App = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [namespaces, setNamespaces] = useState<Namespace[]>([])

  useEffect(() => {
    socket.connect()

    const handleConnect = () => {
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleListNamespaces = (data: Namespace[]) => {
      setNamespaces(data)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('list_namespaces', handleListNamespaces)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('list_namespaces', handleListNamespaces)

      socket.disconnect()
    }
  }, [])

  return (
    <Box>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Socket status: {isConnected ? 'connected' : 'disconnected'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Grid container padding={1} spacing={2} disableEqualOverflow>
        <Grid xs={1}>
          <Paper
            sx={{
              display: 'flex',
              flexFlow: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 1,
              gap: 1,
            }}
          >
            {namespaces.map((namespace) => {
              return <Avatar key={namespace.name} src={namespace.imageSrc} />
            })}
          </Paper>
        </Grid>
        <Grid xs={11}>
          <Paper>11</Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
