import { useSimulationStore } from '@/store/simulationStore'
import { Sliders } from 'lucide-react'

function formatNumber(n: number): string {
  return n.toLocaleString()
}

export default function ResultPanel() {
  const { result, phase, manipulationMode, enterManipulationMode } = useSimulationStore()

  if (!result || phase !== 'complete') return null

  const {
    XBinary,
    actualDiffPositions,
    bobPhase,
    accuracy,
    correctPositions,
    X,
    totalActualDiffs,
    totalCorrectDiffs,
    isTruncated,
    totalLength,
    alicePhase,
  } = result

  const totalInferredDiffs = bobPhase.totalInferredDiffs
  const displayBinary = XBinary.padStart(20, '0').slice(0, 20)
  const falsePositives = bobPhase.inferredDiffPositions.length - correctPositions.length

  if (manipulationMode) return null

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm tracking-widest text-accent-green uppercase">
          通信结果
        </h2>
        <span className="text-[10px] text-text-dim font-mono">
          长度: {formatNumber(totalLength)} 位
        </span>
      </div>

      <div>
        <div className="text-xs text-text-dim mb-2">Alice 发送的 20-bit 整数 X</div>
        <div className="grid grid-cols-10 gap-1 w-full">
          {displayBinary.split('').map((bit, i) => (
            <div
              key={i}
              className="bit-cell h-7 flex items-center justify-center rounded text-[10px] font-display border"
              style={{
                color: bit === '1' ? '#00e5ff' : '#555570',
                borderColor: bit === '1' ? 'rgba(0,229,255,0.4)' : 'rgba(42,42,58,0.6)',
                backgroundColor: bit === '1' ? 'rgba(0,229,255,0.1)' : 'rgba(10,10,15,0.5)',
                boxShadow: bit === '1' ? '0 0 4px rgba(0,229,255,0.3)' : 'none',
                minWidth: '1.25rem',
              }}
            >
              {bit}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-text-dim mt-2 font-mono flex items-center justify-between">
          <span>十进制: <span className="text-accent-blue">{X}</span></span>
          <span>模式: <span className={alicePhase.mode === 'exact' ? 'text-accent-blue' : 'text-yellow-400'}>{alicePhase.mode === 'exact' ? '精确' : '有损'}</span></span>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-xs text-text-dim mb-3">差异位置对比</div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-accent-blue font-display">
                实际差异
              </span>
              <span className="text-[10px] text-text-dim font-mono">
                共 <span className="text-accent-blue">{formatNumber(totalActualDiffs)}</span> 个
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {actualDiffPositions.length > 0 ? (
                <>
                  {actualDiffPositions.map((pos) => (
                    <span
                      key={pos}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-accent-blue/15 text-accent-blue rounded border border-accent-blue/30"
                    >
                      {pos}
                    </span>
                  ))}
                  {isTruncated && actualDiffPositions.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono text-text-dim">
                      ...
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-text-dim">无差异</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-accent-green font-display">
                Bob 推断
              </span>
              <span className="text-[10px] text-text-dim font-mono">
                共 <span className="text-accent-green">{formatNumber(totalInferredDiffs)}</span> 个
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {bobPhase.inferredDiffPositions.length > 0 ? (
                <>
                  {bobPhase.inferredDiffPositions.map((pos) => {
                    const isCorrect = correctPositions.includes(pos)
                    return (
                      <span
                        key={pos}
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                          isCorrect
                            ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
                            : 'bg-red-400/15 text-red-400 border-red-400/30'
                        }`}
                      >
                        {pos}
                      </span>
                    )
                  })}
                  {isTruncated && bobPhase.inferredDiffPositions.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono text-text-dim">
                      ...
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-text-dim">推断无差异</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-dim">定位准确率</span>
          <span
            className="font-display text-xl"
            style={{
              color: accuracy >= 0.8 ? '#39ff14' : accuracy >= 0.5 ? '#ffaa00' : '#ff4444',
              textShadow: accuracy >= 0.8
                ? '0 0 10px rgba(57,255,20,0.6)'
                : accuracy >= 0.5
                ? '0 0 10px rgba(255,170,0,0.6)'
                : '0 0 10px rgba(255,68,68,0.6)',
            }}
          >
            {(accuracy * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-bg rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.min(100, accuracy * 100)}%`,
              backgroundColor: accuracy >= 0.8 ? '#39ff14' : accuracy >= 0.5 ? '#ffaa00' : '#ff4444',
              boxShadow: accuracy >= 0.8
                ? '0 0 8px rgba(57,255,20,0.5)'
                : accuracy >= 0.5
                ? '0 0 8px rgba(255,170,0,0.5)'
                : '0 0 8px rgba(255,68,68,0.5)',
            }}
          />
        </div>
        <div className="text-[10px] text-text-dim mt-2 space-y-1">
          <div>
            命中 <span className="text-accent-green">{formatNumber(totalCorrectDiffs)}</span> /{' '}
            <span className="text-text">{formatNumber(totalActualDiffs)}</span> 个差异位
            {totalInferredDiffs > totalCorrectDiffs && (
              <span className="text-red-400 ml-2">
                (误报 {formatNumber(totalInferredDiffs - totalCorrectDiffs)} 个)
              </span>
            )}
          </div>
          {isTruncated && (
            <div className="text-text-dim/60 italic">
              * 列表仅显示前 200 个位置，总数为精确统计
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <button
          onClick={enterManipulationMode}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/10 border border-purple-500/40 rounded-lg text-sm font-display text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/60 transition-all"
        >
          <Sliders size={14} />
          进入操控模式 · 手动调节 X 值
        </button>
        <div className="text-[9px] text-text-dim/60 mt-2 text-center">
          深入理解 20-bit 信息如何编码差异位置
        </div>
      </div>
    </div>
  )
}
