import { useSimulationStore } from '@/store/simulationStore'
import { RotateCcw, X } from 'lucide-react'
import { useState } from 'react'

const GROUP_SIZE = 20
const MAX_X = 0xFFFFF

export default function XControlPanel() {
  const {
    result,
    manualX,
    manipulationResult,
    flipBit,
    setManualX,
    resetManualX,
    exitManipulationMode,
  } = useSimulationStore()

  const [inputValue, setInputValue] = useState<string>(manualX.toString())

  if (!result || !manipulationResult) return null

  const originalX = result.X
  const binaryStr = manualX.toString(2).padStart(GROUP_SIZE, '0')
  const originalBinaryStr = originalX.toString(2).padStart(GROUP_SIZE, '0')

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    setManualX(val)
    setInputValue(val.toString())
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    const num = parseInt(val)
    if (!isNaN(num) && num >= 0 && num <= MAX_X) {
      setManualX(num)
    }
  }

  const handleNumberBlur = () => {
    setInputValue(manualX.toString())
  }

  const formatNumber = (n: number) => n.toLocaleString()

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm tracking-widest text-purple-400 uppercase">
          操控模式
        </h2>
        <button
          onClick={exitManipulationMode}
          className="text-[10px] text-text-dim hover:text-text flex items-center gap-1"
        >
          <X size={12} />
          退出
        </button>
      </div>

      <div className="text-[10px] text-text-dim/80 leading-relaxed bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
        修改下方 <span className="text-purple-400 font-bold">X 值</span>，观察 Bob
        的推断结果如何变化。每一位 X 控制一整组 20 个位置的差异推断。
      </div>

      <div>
        <div className="text-xs text-text-dim mb-2 flex items-center justify-between">
          <span>20-bit X 二进制表示</span>
          <span className="text-[10px] text-text-dim/60">点击切换 0/1</span>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {binaryStr.split('').map((bit, i) => {
            const isOriginal = bit === originalBinaryStr[i]
            return (
              <button
                key={i}
                onClick={() => flipBit(i)}
                className="relative aspect-square flex items-center justify-center rounded text-xs font-mono font-bold transition-all hover:scale-110"
                style={{
                  color: bit === '1' ? '#c084fc' : '#44445a',
                  backgroundColor: bit === '1' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(10, 10, 15, 0.5)',
                  border: `1px solid ${
                    !isOriginal
                      ? 'rgba(255, 170, 0, 0.8)'
                      : bit === '1'
                      ? 'rgba(192, 132, 252, 0.4)'
                      : 'rgba(42, 42, 58, 0.6)'
                  }`,
                  boxShadow:
                    bit === '1'
                      ? '0 0 6px rgba(192, 132, 252, 0.5)'
                      : 'none',
                }}
                title={`Bit ${i} (组内位置 ${i}): ${originalBinaryStr[i]} → ${bit}`}
              >
                {bit}
                {!isOriginal && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#ffaa00' }}
                  />
                )}
              </button>
            )
          })}
        </div>
        <div className="flex justify-between mt-1 px-0.5">
          {[0, 4, 9, 14, 19].map((i) => (
            <span key={i} className="text-[8px] text-text-dim/40 font-mono">
              {i}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <div className="text-xs text-text-dim mb-1.5">滑块调节</div>
          <input
            type="range"
            min={0}
            max={MAX_X}
            value={manualX}
            onChange={handleSliderChange}
            className="w-full h-2 bg-bg rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: '#c084fc',
            }}
          />
        </div>
        <div className="w-28">
          <div className="text-xs text-text-dim mb-1.5">十进制</div>
          <input
            type="number"
            min={0}
            max={MAX_X}
            value={inputValue}
            onChange={handleNumberChange}
            onBlur={handleNumberBlur}
            className="w-full bg-bg border border-border rounded-lg px-2 py-1.5 text-sm font-mono text-purple-400 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={resetManualX}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface-hover border border-border rounded-lg text-xs text-text-dim hover:text-text hover:border-text-dim/50 transition-all"
        >
          <RotateCcw size={12} />
          重置为原始 X
        </button>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <div className="text-xs text-text-dim mb-2">实时推断结果</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg rounded-lg p-3 text-center">
            <div className="text-[10px] text-text-dim mb-1">推断差异</div>
            <div className="text-lg font-display text-accent-green">
              {formatNumber(manipulationResult.totalInferredDiffs)}
            </div>
          </div>
          <div className="bg-bg rounded-lg p-3 text-center">
            <div className="text-[10px] text-text-dim mb-1">正确推断</div>
            <div className="text-lg font-display text-yellow-400">
              {formatNumber(manipulationResult.totalCorrectDiffs)}
            </div>
          </div>
        </div>

        <div className="bg-bg rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-dim">准确率</span>
            <span
              className="text-sm font-display"
              style={{
                color:
                  manipulationResult.accuracy >= 0.8
                    ? '#39ff14'
                    : manipulationResult.accuracy >= 0.5
                    ? '#ffaa00'
                    : '#ff4444',
              }}
            >
              {(manipulationResult.accuracy * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 bg-bg-dark rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, manipulationResult.accuracy * 100)}%`,
                backgroundColor:
                  manipulationResult.accuracy >= 0.8
                    ? '#39ff14'
                    : manipulationResult.accuracy >= 0.5
                    ? '#ffaa00'
                    : '#ff4444',
              }}
            />
          </div>
        </div>

        <div className="text-[10px] text-text-dim/60 space-y-1">
          <div>
            原始 X: <span className="text-text font-mono">{originalX}</span>
            <span className="ml-2 text-purple-400">
              → {manualX !== originalX ? <span className="text-purple-400">{manualX}</span> : <span className="text-text-dim">(未修改)</span>}
            </span>
          </div>
          <div>
            误报数:{' '}
            <span className="text-red-400 font-mono">
              {formatNumber(
                manipulationResult.totalInferredDiffs - manipulationResult.totalCorrectDiffs
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <div className="text-xs text-text-dim mb-2">图例</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-text-dim">X 位 = 1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-text-dim">已修改位</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-blue" />
            <span className="text-text-dim">实际差异</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-text-dim">Bob 推断</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-text-dim">正确推断</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-text-dim">误报</span>
          </div>
        </div>
      </div>
    </div>
  )
}
