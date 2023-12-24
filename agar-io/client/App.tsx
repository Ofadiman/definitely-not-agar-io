import { useRef } from 'react'

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const context = canvasRef.current?.getContext('2d')

  return <canvas ref={canvasRef} className="h-screen w-screen bg-slate-950"></canvas>
}

export default App
