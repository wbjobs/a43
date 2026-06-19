import { create } from 'zustand'

export type Phase = 'idle' | 'alice_computing' | 'transmitting' | 'bob_computing' | 'complete'

export interface SimulateResult {
  X: number
  XBinary: string
  totalLength: number
  alicePhase: {
    mode: 'exact' | 'lossy'
    output: number
    outputBinary: string
  }
  bobPhase: {
    input: { X: number }
    totalInferredDiffs: number
    inferredDiffPositions: number[]
  }
  totalActualDiffs: number
  actualDiffPositions: number[]
  totalCorrectDiffs: number
  correctPositions: number[]
  accuracy: number
  isTruncated: boolean
}

export interface ManipulationResult {
  totalInferredDiffs: number
  inferredDiffPositions: number[]
  totalCorrectDiffs: number
  correctPositions: number[]
  accuracy: number
  falsePositivePositions: number[]
}

const GROUP_SIZE = 20

function computeBobInference(S: string, T: string, X: number): ManipulationResult {
  const len = S.length
  const actualDiffSet = new Set<number>()
  for (let i = 0; i < len; i++) {
    if (S[i] !== T[i]) {
      actualDiffSet.add(i)
    }
  }

  let tXor = 0
  for (let i = 0; i < len; i += GROUP_SIZE) {
    const chunkEnd = Math.min(i + GROUP_SIZE, len)
    let chunk = T.slice(i, chunkEnd)
    if (chunk.length < GROUP_SIZE) chunk = chunk.padEnd(GROUP_SIZE, '0')
    tXor ^= parseInt(chunk, 2)
  }
  tXor = tXor & 0xFFFFF

  const XBinary = X.toString(2).padStart(GROUP_SIZE, '0')
  const tXorBinary = tXor.toString(2).padStart(GROUP_SIZE, '0')

  const diffBits: number[] = []
  for (let b = 0; b < GROUP_SIZE; b++) {
    if (XBinary[b] !== tXorBinary[b]) {
      diffBits.push(b)
    }
  }

  const numGroups = Math.ceil(len / GROUP_SIZE)
  const totalInferredDiffs = diffBits.length * numGroups

  const inferredSet = new Set<number>()
  const inferredDiffPositions: number[] = []
  for (const bitPos of diffBits) {
    for (let g = 0; g < numGroups; g++) {
      const pos = g * GROUP_SIZE + bitPos
      if (pos < len) {
        inferredSet.add(pos)
        if (inferredDiffPositions.length < 200) {
          inferredDiffPositions.push(pos)
        }
      }
    }
  }
  inferredDiffPositions.sort((a, b) => a - b)

  let totalCorrectDiffs = 0
  const correctPositions: number[] = []
  const falsePositivePositions: number[] = []
  for (const pos of inferredSet) {
    if (actualDiffSet.has(pos)) {
      totalCorrectDiffs++
      if (correctPositions.length < 200) {
        correctPositions.push(pos)
      }
    } else {
      if (falsePositivePositions.length < 200) {
        falsePositivePositions.push(pos)
      }
    }
  }
  correctPositions.sort((a, b) => a - b)
  falsePositivePositions.sort((a, b) => a - b)

  const totalActualDiffs = actualDiffSet.size
  const accuracy = totalActualDiffs > 0 ? totalCorrectDiffs / totalActualDiffs : (totalInferredDiffs === 0 ? 1 : 0)

  return {
    totalInferredDiffs,
    inferredDiffPositions,
    totalCorrectDiffs,
    correctPositions,
    accuracy,
    falsePositivePositions,
  }
}

interface SimulationStore {
  S: string
  T: string
  phase: Phase
  result: SimulateResult | null
  error: string | null
  manipulationMode: boolean
  manualX: number
  manipulationResult: ManipulationResult | null
  setS: (s: string) => void
  setT: (t: string) => void
  generateRandom: (length?: number) => void
  startSimulation: () => Promise<void>
  reset: () => void
  enterManipulationMode: () => void
  exitManipulationMode: () => void
  setManualX: (x: number) => void
  flipBit: (bitIndex: number) => void
  resetManualX: () => void
}

function generateRandomBinary(length: number): string {
  const chunk = 4096
  let result = ''
  for (let i = 0; i < length; i += chunk) {
    const end = Math.min(i + chunk, length)
    const len = end - i
    let chunkStr = ''
    for (let j = 0; j < len; j++) {
      chunkStr += Math.random() > 0.5 ? '1' : '0'
    }
    result += chunkStr
  }
  return result
}

function generateWithDiffs(base: string, numDiffs: number): string {
  const arr = base.split('')
  const len = arr.length
  const positions = new Set<number>()
  while (positions.size < numDiffs) {
    positions.add(Math.floor(Math.random() * len))
  }
  positions.forEach(pos => {
    arr[pos] = arr[pos] === '0' ? '1' : '0'
  })
  return arr.join('')
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  S: '',
  T: '',
  phase: 'idle',
  result: null,
  error: null,
  manipulationMode: false,
  manualX: 0,
  manipulationResult: null,

  setS: (s: string) => set({ S: s.replace(/[^01]/g, ''), error: null }),
  setT: (t: string) => set({ T: t.replace(/[^01]/g, ''), error: null }),

  generateRandom: (length: number = 20) => {
    const s = generateRandomBinary(length)
    const numDiffs = Math.max(1, Math.floor(Math.random() * Math.min(10, Math.floor(length * 0.05) + 1)))
    const t = generateWithDiffs(s, numDiffs)
    set({ S: s, T: t, error: null, manipulationMode: false, manipulationResult: null })
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

    set({ phase: 'alice_computing', error: null, result: null, manipulationMode: false, manipulationResult: null })

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

  reset: () => set({
    S: '', T: '', phase: 'idle', result: null, error: null,
    manipulationMode: false, manualX: 0, manipulationResult: null,
  }),

  enterManipulationMode: () => {
    const { result, S, T } = get()
    if (!result || !S || !T) return
    const X = result.X
    const manResult = computeBobInference(S, T, X)
    set({ manipulationMode: true, manualX: X, manipulationResult: manResult })
  },

  exitManipulationMode: () => {
    set({ manipulationMode: false, manipulationResult: null })
  },

  setManualX: (x: number) => {
    const { S, T } = get()
    if (!S || !T) return
    const clampedX = Math.max(0, Math.min(0xFFFFF, Math.floor(x)))
    const manResult = computeBobInference(S, T, clampedX)
    set({ manualX: clampedX, manipulationResult: manResult })
  },

  flipBit: (bitIndex: number) => {
    if (bitIndex < 0 || bitIndex >= GROUP_SIZE) return
    const { manualX, S, T } = get()
    if (!S || !T) return
    const newX = manualX ^ (1 << (GROUP_SIZE - 1 - bitIndex))
    const manResult = computeBobInference(S, T, newX)
    set({ manualX: newX, manipulationResult: manResult })
  },

  resetManualX: () => {
    const { result, S, T } = get()
    if (!result || !S || !T) return
    const manResult = computeBobInference(S, T, result.X)
    set({ manualX: result.X, manipulationResult: manResult })
  },
}))
