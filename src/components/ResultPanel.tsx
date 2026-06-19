import { useSimulationStore } from '@/store/simulationStore'

export default function ResultPanel() {
  const { result, phase } = useSimulationStore()

  if (!result || phase !== 'complete') return null

  const { XBinary, actualDiffPositions, bobPhase, accuracy, correctPositions, X } = result

  const displayBinary = XBinary.padStart(20, '0').slice(0, 20)

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
      <h2 className="font-display text-sm tracking-widest text-accent-green uppercase">
        通信结果
      </h2>

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
        <div className="text-[10px] text-text-dim mt-2 font-mono">
          十进制: <span className="text-accent-blue">{X}</span>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-xs text-text-dim mb-3">差异位置对比</div>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <span className="text-[10px] text-accent-blue font-display shrink-0 pt-1 w-14">
              实际差异
            </span>
            <div className="flex flex-wrap gap-1 flex-1">
              {actualDiffPositions.length > 0 ? (
                actualDiffPositions.map((pos) => (
                  <span
                    key={pos}
                    className="px-1.5 py-0.5 text-[10px] font-mono bg-accent-blue/15 text-accent-blue rounded border border-accent-blue/30"
                  >
                    {pos}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-dim">无差异</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-[10px] text-accent-green font-display shrink-0 pt-1 w-14">
              Bob 推断
            </span>
            <div className="flex flex-wrap gap-1 flex-1">
              {bobPhase.inferredDiffPositions.length > 0 ? (
                bobPhase.inferredDiffPositions.map((pos) => {
                  const isCorrect = actualDiffPositions.includes(pos)
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
                })
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
        <div className="text-[10px] text-text-dim mt-2">
          命中 <span className="text-accent-green">{correctPositions.length}</span> /{' '}
          <span className="text-text">{actualDiffPositions.length}</span> 个差异位
          {bobPhase.inferredDiffPositions.length > actualDiffPositions.length && (
            <span className="text-red-400 ml-2">
              (误报 {bobPhase.inferredDiffPositions.length - correctPositions.length} 个)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
