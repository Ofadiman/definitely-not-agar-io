import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { CssBaseline, GlobalStyles } from '@mui/material'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CssBaseline />
    <GlobalStyles
      styles={() => ({
        '#root': {
          minHeight: '100vh',
          display: 'flex',
          flexFlow: 'column',
        },
      })}
    />
    <App />
  </React.StrictMode>,
)
