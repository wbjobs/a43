import { create } from 'zustand'

export type Phase = 'idle' | 'alice_computing' | 'transmitting' | 'bob_computing' | 'complete'

export interface SimulateResult {
  X: number
  XBinary: string
  alicePhase: {
    input: string
    output: number
    outputBinary: string
  }
  bobPhase: {
    input: { X: number; T: string }
    inferredDiffPositions: number[]
  }
  actualDiffPositions: number[]
  correctPositions: number[]
  accuracy: number
}

interface SimulationStore {
  S: string
  T: string
  phase: Phase
  result: SimulateResult | null
  error: string | null
  setS: (s: string) => void
  setT: (t: string) => void
  generateRandom: (length?: number) => void
  startSimulation: () => Promise<void>
  reset: () => void
}

function generateRandomBinary(length: number): string {
  return Array.from({ length }, () => Math.random() > 0.5 ? '1' : '0').join('')
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  S: '',
  T: '',
  phase: 'idle',
  result: null,
  error: null,

  setS: (s: string) => set({ S: s.replace(/[^01]/g, ''), error: null }),
  setT: (t: string) => set({ T: t.replace(/[^01]/g, ''), error: null }),

  generateRandom: (length: number = 20) => {
    const s = generateRandomBinary(length)
    let t = s.split('')
    const numDiffs = Math.max(1, Math.floor(Math.random() * Math.min(5, length)))
    const positions = new Set<number>()
    while (positions.size < numDiffs) {
      positions.add(Math.floor(Math.random() * length))
    }
    positions.forEach(pos => {
      t[pos] = t[pos] === '0' ? '1' : '0'
    })
    set({ S: s, T: t.join(''), error: null })
  },

  startSimulation: async () => {
    const { S, T } = get()
    if (!S || !T) {
      set({ error: '请输入 S 和 T' })
      return
    }
    if (S.length !== T.length) {
      set({ error: 'S 和 T 长度必须相同' })
      return
    }

    set({ phase: 'alice_computing', error: null, result: null })

    await new Promise(r => setTimeout(r, 1000))

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ S, T }),
      })

      const json = await res.json()

      if (!json.success) {
        set({ phase: 'idle', error: json.error || '模拟失败' })
        return
      }

      const data: SimulateResult = json.data

      set({ phase: 'transmitting' })
      await new Promise(r => setTimeout(r, 4000))

      set({ phase: 'bob_computing' })
      await new Promise(r => setTimeout(r, 1000))

      set({ phase: 'complete', result: data })
    } catch {
      set({ phase: 'idle', error: '网络错误，请检查后端服务' })
    }
  },

  reset: () => set({ S: '', T: '', phase: 'idle', result: null, error: null }),
}))
