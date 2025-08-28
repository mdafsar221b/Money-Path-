import { useState } from 'react'
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
