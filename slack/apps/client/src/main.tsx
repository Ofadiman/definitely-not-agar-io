import React from 'react'
import ReactDOM from 'react-dom/client'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>cleanup</div>
  </React.StrictMode>,
)
