import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function App() {
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function checkBackend() {
    setIsLoading(true)
    setResult('')

    try {
      const response = await fetch('/api/reserve')
      setResult(response.ok ? await response.text() : `HTTP ${response.status}`)
    } catch {
      setResult('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold">Календарь звонков</h1>
      <Button onClick={checkBackend} disabled={isLoading}>
        Check
      </Button>
      <p role="status">{result}</p>
    </main>
  )
}
