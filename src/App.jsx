import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import FinanceTracker from './Components/FinanceTracker'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <FinanceTracker/>
    </>
  )
}

export default App
