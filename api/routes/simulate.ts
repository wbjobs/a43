import { Router, type Request, type Response } from 'express'

const router = Router()

const CHUNK_SIZE = 10000
const MAX_DISPLAY_DIFFS = 200
const MAX_STRING_LENGTH = 1_000_000
const GROUP_SIZE = 20

interface SimulateRequest {
  S: string
  T: string
}

interface SimulateResponse {
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

function validateBinaryChunked(str: string, maxLen: number): boolean {
  if (str.length > maxLen) return false
  for (let i = 0; i < str.length; i += CHUNK_SIZE) {
    const end = Math.min(i + CHUNK_SIZE, str.length)
    const chunk = str.slice(i, end)
    if (!/^[01]+$/.test(chunk)) return false
  }
  return true
}

function computeXorX(S: string): { X: number; XBinary: string; mode: 'exact' | 'lossy' } {
  const len = S.length
  const mode: 'exact' | 'lossy' = len <= GROUP_SIZE ? 'exact' : 'lossy'

  if (len <= GROUP_SIZE) {
    const X = len === 0 ? 0 : parseInt(S, 2)
    const XBinary = X.toString(2).padStart(len, '0')
    return { X: isNaN(X) ? 0 : X, XBinary, mode }
  }

  let xorResult = 0
  for (let i = 0; i < len; i += GROUP_SIZE) {
    const chunkEnd = Math.min(i + GROUP_SIZE, len)
    let chunk = S.slice(i, chunkEnd)
    if (chunk.length < GROUP_SIZE) chunk = chunk.padEnd(GROUP_SIZE, '0')
    xorResult ^= parseInt(chunk, 2)
  }
  xorResult = xorResult & 0xFFFFF

  return {
    X: xorResult,
    XBinary: xorResult.toString(2).padStart(GROUP_SIZE, '0'),
    mode,
  }
}

function computeSinglePass(
  S: string,
  T: string,
  X: number,
  mode: 'exact' | 'lossy',
): {
  totalActualDiffs: number
  actualDiffPositions: number[]
  totalInferredDiffs: number
  inferredDiffPositions: number[]
  totalCorrectDiffs: number
  correctPositions: number[]
  accuracy: number
} {
  const len = Math.min(S.length, T.length)

  let totalActualDiffs = 0
  let totalCorrectDiffs = 0
  const actualDiffPositions: number[] = []
  const correctPositions: number[] = []

  let totalInferredDiffs = 0
  const inferredDiffPositions: number[] = []
  const inferredSet = new Set<number>()

  if (mode === 'exact') {
    const XBinary = X.toString(2).padStart(len, '0')
    totalInferredDiffs = 0

    for (let i = 0; i < len; i++) {
      const isDiff = S[i] !== T[i]
      const isInferred = XBinary[i] !== T[i]

      if (isDiff) {
        totalActualDiffs++
        if (actualDiffPositions.length < MAX_DISPLAY_DIFFS) {
          actualDiffPositions.push(i)
        }
      }

      if (isInferred) {
        totalInferredDiffs++
        if (inferredDiffPositions.length < MAX_DISPLAY_DIFFS) {
          inferredDiffPositions.push(i)
          inferredSet.add(i)
        }
      }

      if (isDiff && isInferred) {
        totalCorrectDiffs++
        if (correctPositions.length < MAX_DISPLAY_DIFFS) {
          correctPositions.push(i)
        }
      }
    }
  } else {
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
    totalInferredDiffs = diffBits.length * numGroups

    for (const bitPos of diffBits) {
      if (inferredDiffPositions.length >= MAX_DISPLAY_DIFFS) break
      for (let g = 0; g < numGroups; g++) {
        if (inferredDiffPositions.length >= MAX_DISPLAY_DIFFS) break
        const pos = g * GROUP_SIZE + bitPos
        if (pos < len) {
          inferredDiffPositions.push(pos)
          inferredSet.add(pos)
        }
      }
    }
    inferredDiffPositions.sort((a, b) => a - b)

    for (let i = 0; i < len; i++) {
      if (S[i] !== T[i]) {
        totalActualDiffs++
        if (actualDiffPositions.length < MAX_DISPLAY_DIFFS) {
          actualDiffPositions.push(i)
        }

        const bitInGroup = i % GROUP_SIZE
        const isInferred = XBinary[bitInGroup] !== tXorBinary[bitInGroup]
        if (isInferred) {
          totalCorrectDiffs++
          if (correctPositions.length < MAX_DISPLAY_DIFFS) {
            correctPositions.push(i)
          }
        }
      }
    }
  }

  const accuracy = totalActualDiffs > 0 ? totalCorrectDiffs / totalActualDiffs : (totalInferredDiffs === 0 ? 1 : 0)

  return {
    totalActualDiffs,
    actualDiffPositions,
    totalInferredDiffs,
    inferredDiffPositions,
    totalCorrectDiffs,
    correctPositions,
    accuracy,
  }
}

router.post('/', (req: Request, res: Response) => {
  try {
    const { S, T } = req.body as SimulateRequest

    if (!S || !T) {
      res.status(400).json({ success: false, error: 'S and T are required' })
      return
    }

    if (S.length !== T.length) {
      res.status(400).json({ success: false, error: 'S and T must have the same length' })
      return
    }

    if (S.length > MAX_STRING_LENGTH) {
      res.status(400).json({
        success: false,
        error: `String length exceeds maximum allowed length of ${MAX_STRING_LENGTH}`,
      })
      return
    }

    if (!validateBinaryChunked(S, MAX_STRING_LENGTH) || !validateBinaryChunked(T, MAX_STRING_LENGTH)) {
      res.status(400).json({ success: false, error: 'S and T must be binary strings (0s and 1s only)' })
      return
    }

    const { X, XBinary, mode } = computeXorX(S)

    const stats = computeSinglePass(S, T, X, mode)

    const isTruncated =
      stats.totalActualDiffs > MAX_DISPLAY_DIFFS ||
      stats.totalInferredDiffs > MAX_DISPLAY_DIFFS

    const response: SimulateResponse = {
      X,
      XBinary,
      totalLength: S.length,
      alicePhase: {
        mode,
        output: X,
        outputBinary: XBinary,
      },
      bobPhase: {
        input: { X },
        totalInferredDiffs: stats.totalInferredDiffs,
        inferredDiffPositions: stats.inferredDiffPositions,
      },
      totalActualDiffs: stats.totalActualDiffs,
      actualDiffPositions: stats.actualDiffPositions,
      totalCorrectDiffs: stats.totalCorrectDiffs,
      correctPositions: stats.correctPositions,
      accuracy: stats.accuracy,
      isTruncated,
    }

    res.json({ success: true, data: response })
  } catch (err) {
    console.error('Simulate error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
