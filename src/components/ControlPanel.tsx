import { useSimulationStore } from '@/store/simulationStore'
import { Dices, Play, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const LARGE_STRING_THRESHOLD = 500

function formatNumber(n: number): string {
  return n.toLocaleString()
}

function StringInput({
  label,
  value,
  color,
  onChange,
  disabled,
  placeholder,
}: {
  label: string
  value: string
  color: 'blue' | 'green'
  onChange: (v: string) => void
  disabled: boolean
  placeholder: string
}) {
  const [showFull, setShowFull] = useState(false)
  const isLarge = value.length > LARGE_STRING_THRESHOLD
  const colorClass = color === 'blue' ? 'accent-blue' : 'accent-green'
  const colorHex = color === 'blue' ? '#00e5ff' : '#39ff14'

  const displayValue = isLarge && !showFull
    ? value.slice(0, 40) + '...' + value.slice(-10)
    : value

  return (
    <div>
      <label className="flex items-center justify-between text-xs text-text-dim mb-1.5">
        <span className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: colorHex }}
          />
          {label}
        </span>
        {isLarge && (
          <button
            type="button"
            onClick={() => setShowFull(!showFull)}
            className="text-[10px] text-text-dim hover:text-text flex items-center gap-1"
            disabled={disabled}
          >
            {showFull ? <EyeOff size={10} /> : <Eye size={10} />}
            {showFull ? '隐藏' : '展开'}
          </button>
        )}
      </label>
      {isLarge ? (
        <div
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono"
          style={{ color: colorHex }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-dim">长度: {formatNumber(value.length)} 位</span>
            <span className="text-[10px] text-text-dim">
              模式: {value.length <= 20 ? '精确传输' : '有损压缩'}
            </span>
          </div>
          {showFull ? (
            <div className="text-[10px] break-all font-mono leading-relaxed max-h-24 overflow-y-auto">
              {value}
            </div>
          ) : (
            <div className="text-xs font-mono truncate">{displayValue}</div>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono text-${colorClass} placeholder-text-dim/40 focus:outline-none focus:border-${colorClass}/50 focus:ring-1 focus:ring-${colorClass}/20 transition-all disabled:opacity-40`}
          style={{
            color: colorHex,
          }}
        />
      )}
    </div>
  )
}

export default function ControlPanel() {
  const { S, T, phase, error, setS, setT, generateRandom, startSimulation, reset } = useSimulationStore()

  const isRunning = phase !== 'idle' && phase !== 'complete'

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
      <h2 className="font-display text-sm tracking-widest text-accent-blue uppercase">
        输入控制
      </h2>

      <div className="space-y-3">
        <StringInput
          label="Alice 的串 S（01 字符串）"
          value={S}
          color="blue"
          onChange={setS}
          disabled={isRunning}
          placeholder="例如: 10110011001011100011"
        />

        <StringInput
          label="Bob 的串 T（01 字符串）"
          value={T}
          color="green"
          onChange={setT}
          disabled={isRunning}
          placeholder="例如: 10110011001011100011"
        />
      </div>

      <div>
        <div className="text-xs text-text-dim mb-2">随机生成</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '20', len: 20 },
            { label: '60', len: 60 },
            { label: '100', len: 100 },
            { label: '1K', len: 1000 },
            { label: '10K', len: 10000 },
            { label: '100K', len: 100000 },
            { label: '500K', len: 500000 },
            { label: '1M', len: 1000000 },
          ].map(({ label, len }) => (
            <button
              key={len}
              onClick={() => generateRandom(len)}
              disabled={isRunning}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-surface-hover border border-border rounded-lg text-xs text-text-dim hover:text-text hover:border-text-dim/50 transition-all disabled:opacity-30 font-mono"
            >
              <Dices size={10} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={startSimulation}
          disabled={isRunning || !S || !T}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue/10 border border-accent-blue/40 rounded-lg text-sm font-display text-accent-blue hover:bg-accent-blue/20 hover:border-accent-blue/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed animate-pulse-blue"
        >
          <Play size={14} />
          开始通信
        </button>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-surface-hover border border-border rounded-lg text-xs text-text-dim hover:text-text hover:border-text-dim/50 transition-all"
        >
          <RotateCcw size={12} />
          重置
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {S && T && (
        <div className="text-xs text-text-dim space-y-1 pt-1 border-t border-border">
          <div>串长度: <span className="text-text font-mono">{formatNumber(S.length)} 位</span></div>
          <div>通信容量: <span className="text-text">20 bit</span></div>
          {S.length <= 20 ? (
            <div className="text-accent-blue">模式: 精确传输（S ≤ 20 位）</div>
          ) : (
            <div className="text-yellow-400">模式: 有损压缩（XOR 校验和）</div>
          )}
          <div className="text-text-dim/60 text-[10px]">
            最大支持: {formatNumber(1_000_000)} 位
          </div>
        </div>
      )}
    </div>
  )
}
