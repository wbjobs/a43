import { useSimulationStore } from '@/store/simulationStore'
import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'

const GROUP_SIZE = 20
const MAX_DISPLAY_GROUPS = 50

interface BitInfo {
  position: number
  sBit: string
  tBit: string
  isActualDiff: boolean
  isInferred: boolean
  isCorrect: boolean
  isFalsePositive: boolean
  groupIndex: number
  bitInGroup: number
}

export default function DiffVisualizer() {
  const { S, T, result, manipulationMode, manipulationResult, manualX } = useSimulationStore()
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [hoveredBit, setHoveredBit] = useState<BitInfo | null>(null)

  if (!result || !manipulationMode || !manipulationResult || !S || !T) return null

  const len = Math.min(S.length, T.length)
  const numGroups = Math.ceil(len / GROUP_SIZE)

  const { bitsToShow, groupsToShow, hasMoreGroups } = useMemo(() => {
    const actualDiffSet = new Set<number>(result.actualDiffPositions)
    const inferredSet = new Set<number>(manipulationResult.inferredDiffPositions)
    const correctSet = new Set<number>(manipulationResult.correctPositions)
    const falsePositiveSet = new Set<number>(manipulationResult.falsePositivePositions)

    const bits: BitInfo[] = []
    const groupHasContent = new Set<number>()

    for (let i = 0; i < len; i++) {
      const groupIndex = Math.floor(i / GROUP_SIZE)
      const bitInGroup = i % GROUP_SIZE
      const isActualDiff = S[i] !== T[i]
      const isInferred = inferredSet.has(i)
      const isCorrect = correctSet.has(i)
      const isFalsePositive = falsePositiveSet.has(i)

      if (isActualDiff || isInferred) {
        groupHasContent.add(groupIndex)
      }

      bits.push({
        position: i,
        sBit: S[i],
        tBit: T[i],
        isActualDiff,
        isInferred,
        isCorrect,
        isFalsePositive,
        groupIndex,
        bitInGroup,
      })
    }

    const relevantGroups = Array.from(groupHasContent).sort((a, b) => a - b)
    const displayGroups = showAllGroups
      ? relevantGroups.slice(0, MAX_DISPLAY_GROUPS)
      : relevantGroups.slice(0, Math.min(10, MAX_DISPLAY_GROUPS))

    const displaySet = new Set(displayGroups)
    const filteredBits = bits.filter((b) => displaySet.has(b.groupIndex))

    return {
      bitsToShow: filteredBits,
      groupsToShow: displayGroups,
      hasMoreGroups: relevantGroups.length > (showAllGroups ? MAX_DISPLAY_GROUPS : 10),
    }
  }, [S, T, result, manipulationResult, showAllGroups, len])

  const xBinary = manualX.toString(2).padStart(GROUP_SIZE, '0')

  const getBitCellStyle = (bit: BitInfo) => {
    const base = 'w-4 h-4 flex items-center justify-center text-[8px] font-mono rounded transition-all'

    if (bit.isCorrect) {
      return `${base} bg-yellow-400/20 text-yellow-400 border border-yellow-400/50`
    }
    if (bit.isFalsePositive) {
      return `${base} bg-red-400/20 text-red-400 border border-red-400/50`
    }
    if (bit.isActualDiff) {
      return `${base} bg-accent-blue/20 text-accent-blue border border-accent-blue/50`
    }
    if (bit.isInferred) {
      return `${base} bg-accent-green/20 text-accent-green border border-accent-green/50`
    }
    return `${base} bg-bg text-text-dim/50 border border-transparent`
  }

  const groups = useMemo(() => {
    const map = new Map<number, BitInfo[]>()
    for (const bit of bitsToShow) {
      if (!map.has(bit.groupIndex)) {
        map.set(bit.groupIndex, [])
      }
      map.get(bit.groupIndex)!.push(bit)
    }
    return map
  }, [bitsToShow])

  const manualXBinary = manualX.toString(2).padStart(GROUP_SIZE, '0')

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm tracking-widest text-accent-blue uppercase">
          差异位可视化
        </h2>
        <div className="text-[10px] text-text-dim font-mono">
          共 {result.totalActualDiffs.toLocaleString()} 个实际差异
        </div>
      </div>

      <div className="text-[10px] text-text-dim/80 leading-relaxed bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-3">
        按 <span className="text-accent-blue font-bold">20 位</span> 分组展示。每组对应 X
        的一个 bit 位。X 中为 <span className="text-purple-400 font-bold">1</span>{' '}
        的位，Bob 会推断该组内所有同名位置为差异位。
      </div>

      {bitsToShow.length === 0 ? (
        <div className="text-center py-8 text-text-dim text-sm">
          无差异位可显示
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {groupsToShow.map((groupIdx) => {
              const groupBits = groups.get(groupIdx) || []
              if (groupBits.length === 0) return null

              const xBitForThisGroup = xBinary[groupBits[0].bitInGroup]
              const xBitActive = xBitForThisGroup === '1'

              return (
                <div key={groupIdx} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-dim">
                        组 {groupIdx}
                      </span>
                      <span className="text-[10px] text-text-dim/60">
                        (位置 {groupIdx * GROUP_SIZE} - {Math.min((groupIdx + 1) * GROUP_SIZE - 1, len - 1)})
                      </span>
                      {xBitActive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-400 border border-purple-400/30">
                          X bit = 1 → 整组推断
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-text-dim/60 font-mono">
                      X[{groupBits[0].bitInGroup}] = {xBitForThisGroup}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-accent-blue w-8 shrink-0">S:</span>
                      <div className="flex gap-0.5 flex-wrap">
                        {groupBits.map((bit) => (
                          <div
                            key={`s-${bit.position}`}
                            className={getBitCellStyle(bit)}
                            onMouseEnter={() => setHoveredBit(bit)}
                            onMouseLeave={() => setHoveredBit(null)}
                          >
                            {bit.sBit}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-accent-green w-8 shrink-0">T:</span>
                      <div className="flex gap-0.5 flex-wrap">
                        {groupBits.map((bit) => (
                          <div
                            key={`t-${bit.position}`}
                            className={getBitCellStyle(bit)}
                            onMouseEnter={() => setHoveredBit(bit)}
                            onMouseLeave={() => setHoveredBit(null)}
                          >
                            {bit.tBit}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {hasMoreGroups && (
            <button
              onClick={() => setShowAllGroups(!showAllGroups)}
              className="w-full flex items-center justify-center gap-1 py-2 text-[10px] text-text-dim hover:text-text transition-colors"
            >
              {showAllGroups ? (
                <>
                  <ChevronDown size={12} />
                  收起
                </>
              ) : (
                <>
                  <ChevronRight size={12} />
                  显示更多组
                </>
              )}
            </button>
          )}
        </>
      )}

      {hoveredBit && (
        <div className="bg-bg border border-border rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-text-dim">
            <Info size={12} className="text-accent-blue" />
            <span>位置 {hoveredBit.position} 详情</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-text-dim">S: </span>
              <span
                className={
                  hoveredBit.sBit === '1' ? 'text-accent-blue font-mono' : 'text-text-dim font-mono'
                }
              >
                {hoveredBit.sBit}
              </span>
            </div>
            <div>
              <span className="text-text-dim">T: </span>
              <span
                className={
                  hoveredBit.tBit === '1' ? 'text-accent-green font-mono' : 'text-text-dim font-mono'
                }
              >
                {hoveredBit.tBit}
              </span>
            </div>
            <div>
              <span className="text-text-dim">实际差异: </span>
              <span className={hoveredBit.isActualDiff ? 'text-accent-blue' : 'text-text-dim'}>
                {hoveredBit.isActualDiff ? '是' : '否'}
              </span>
            </div>
            <div>
              <span className="text-text-dim">Bob 推断: </span>
              <span className={hoveredBit.isInferred ? 'text-accent-green' : 'text-text-dim'}>
                {hoveredBit.isInferred ? '是' : '否'}
              </span>
            </div>
            <div>
              <span className="text-text-dim">正确推断: </span>
              <span className={hoveredBit.isCorrect ? 'text-yellow-400' : 'text-text-dim'}>
                {hoveredBit.isCorrect ? '是' : '否'}
              </span>
            </div>
            <div>
              <span className="text-text-dim">误报: </span>
              <span className={hoveredBit.isFalsePositive ? 'text-red-400' : 'text-text-dim'}>
                {hoveredBit.isFalsePositive ? '是' : '否'}
              </span>
            </div>
            <div>
              <span className="text-text-dim">组索引: </span>
              <span className="font-mono text-text">{hoveredBit.groupIndex}</span>
            </div>
            <div>
              <span className="text-text-dim">组内位: </span>
              <span className="font-mono text-text">{hoveredBit.bitInGroup}</span>
            </div>
            <div className="col-span-2">
              <span className="text-text-dim">X[{hoveredBit.bitInGroup}]: </span>
              <span
                className={
                  manualXBinary[hoveredBit.bitInGroup] === '1'
                    ? 'text-purple-400 font-mono'
                    : 'text-text-dim font-mono'
                }
              >
                {manualXBinary[hoveredBit.bitInGroup]}
              </span>
              {manualXBinary[hoveredBit.bitInGroup] === '1' && (
                <span className="text-text-dim/60 ml-1">
                  → 该组所有同名位置被推断为差异
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-3">
        <div className="text-xs text-text-dim mb-2">X 的 20 位与分组位置对应关系</div>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: GROUP_SIZE }).map((_, i) => {
            const bit = xBinary[i]
            return (
              <div
                key={i}
                className="aspect-square flex items-center justify-center rounded text-[8px] font-mono"
                style={{
                  color: bit === '1' ? '#c084fc' : '#44445a',
                  backgroundColor: bit === '1' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(10, 10, 15, 0.5)',
                  border: `1px solid ${bit === '1' ? 'rgba(192, 132, 252, 0.4)' : 'rgba(42, 42, 58, 0.6)'}`,
                }}
                title={`X[${i}] = ${bit} → 所有组的第 ${i} 位${bit === '1' ? '被推断为差异' : '不被推断'}`}
              >
                {i}
              </div>
            )
          })}
        </div>
        <div className="text-[9px] text-text-dim/60 mt-2 text-center">
          X 的第 i 位 = 1 ⇒ 每个分组的第 i 位被 Bob 推断为差异位
        </div>
      </div>
    </div>
  )
}
