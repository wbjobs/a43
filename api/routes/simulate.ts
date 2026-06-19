import { Router, type Request, type Response } from 'express'

const router = Router()

interface SimulateRequest {
  S: string
  T: string
}

interface SimulateResponse {
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

function aliceCompute(S: string): { X: number; XBinary: string } {
  if (S.length <= 20) {
    const X = S.length === 0 ? 0 : parseInt(S, 2)
    const XBinary = X.toString(2).padStart(S.length, '0')
    return { X: isNaN(X) ? 0 : X, XBinary }
  }

  const groups: string[] = []
  for (let i = 0; i < S.length; i += 20) {
    groups.push(S.slice(i, i + 20).padEnd(20, '0'))
  }

  let xorResult = 0
  for (const group of groups) {
    xorResult ^= parseInt(group, 2)
  }

  xorResult = xorResult & 0xFFFFF

  return {
    X: xorResult,
    XBinary: xorResult.toString(2).padStart(20, '0'),
  }
}

function bobInfer(X: number, T: string): number[] {
  if (T.length <= 20) {
    const XBinary = X.toString(2).padStart(T.length, '0')
    const diffs: number[] = []
    for (let i = 0; i < T.length; i++) {
      if (XBinary[i] !== T[i]) {
        diffs.push(i)
      }
    }
    return diffs
  }

  const groups: string[] = []
  for (let i = 0; i < T.length; i += 20) {
    groups.push(T.slice(i, i + 20).padEnd(20, '0'))
  }

  const tXorGroups: number[] = groups.map(g => parseInt(g, 2))

  const XBinary = X.toString(2).padStart(20, '0')
  const tXor = tXorGroups.reduce((acc, val) => acc ^ val, 0) & 0xFFFFF
  const tXorBinary = tXor.toString(2).padStart(20, '0')

  const diffBits: number[] = []
  for (let i = 0; i < 20; i++) {
    if (XBinary[i] !== tXorBinary[i]) {
      diffBits.push(i)
    }
  }

  const diffs: number[] = []
  for (const bitPos of diffBits) {
    for (let g = 0; g < groups.length; g++) {
      const localPos = bitPos
      const globalPos = g * 20 + localPos
      if (globalPos < T.length) {
        diffs.push(globalPos)
      }
    }
  }

  return [...new Set(diffs)].sort((a, b) => a - b)
}

function findActualDiffs(S: string, T: string): number[] {
  const len = Math.min(S.length, T.length)
  const diffs: number[] = []
  for (let i = 0; i < len; i++) {
    if (S[i] !== T[i]) {
      diffs.push(i)
    }
  }
  return diffs
}

router.post('/', (req: Request, res: Response) => {
  const { S, T } = req.body as SimulateRequest

  if (!S || !T) {
    res.status(400).json({ success: false, error: 'S and T are required' })
    return
  }

  if (!/^[01]+$/.test(S) || !/^[01]+$/.test(T)) {
    res.status(400).json({ success: false, error: 'S and T must be binary strings (0s and 1s only)' })
    return
  }

  if (S.length !== T.length) {
    res.status(400).json({ success: false, error: 'S and T must have the same length' })
    return
  }

  const { X, XBinary } = aliceCompute(S)

  const inferredDiffPositions = bobInfer(X, T)
  const actualDiffPositions = findActualDiffs(S, T)

  const inferredSet = new Set(inferredDiffPositions)
  const actualSet = new Set(actualDiffPositions)

  const correctPositions = inferredDiffPositions.filter(p => actualSet.has(p))

  let accuracy: number
  if (actualDiffPositions.length === 0 && inferredDiffPositions.length === 0) {
    accuracy = 1
  } else if (actualDiffPositions.length === 0) {
    accuracy = 0
  } else {
    accuracy = correctPositions.length / actualDiffPositions.length
  }

  const response: SimulateResponse = {
    X,
    XBinary,
    alicePhase: {
      input: S,
      output: X,
      outputBinary: XBinary,
    },
    bobPhase: {
      input: { X, T },
      inferredDiffPositions,
    },
    actualDiffPositions,
    correctPositions,
    accuracy,
  }

  res.json({ success: true, data: response })
})

export default router
