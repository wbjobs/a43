import { useSimulationStore } from '@/store/simulationStore'
import { Dices, Play, RotateCcw } from 'lucide-react'

export default function ControlPanel() {
  const { S, T, phase, error, setS, setT, generateRandom, startSimulation, reset } = useSimulationStore()

  const isRunning = phase !== 'idle' && phase !== 'complete'

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
      <h2 className="font-display text-sm tracking-widest text-accent-blue uppercase">
        输入控制
      </h2>

      <div className="space-y-3">
        <div>
          <label className="flex items-center gap-2 text-xs text-text-dim mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-blue inline-block" />
            Alice 的串 S（01 字符串）
          </label>
          <input
            type="text"
            value={S}
            onChange={(e) => setS(e.target.value)}
            placeholder="例如: 10110011001011100011"
            disabled={isRunning}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm font-body text-accent-blue placeholder-text-dim/40 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all disabled:opacity-40"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs text-text-dim mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-green inline-block" />
            Bob 的串 T（01 字符串）
          </label>
          <input
            type="text"
            value={T}
            onChange={(e) => setT(e.target.value)}
            placeholder="例如: 10110011001011100011"
            disabled={isRunning}
            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm font-body text-accent-green placeholder-text-dim/40 focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-all disabled:opacity-40"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => generateRandom(20)}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-dim hover:text-text hover:border-text-dim/50 transition-all disabled:opacity-30"
        >
          <Dices size={12} />
          随机 20 位
        </button>
        <button
          onClick={() => generateRandom(60)}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-dim hover:text-text hover:border-text-dim/50 transition-all disabled:opacity-30"
        >
          <Dices size={12} />
          随机 60 位
        </button>
        <button
          onClick={() => generateRandom(100)}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-dim hover:text-text hover:border-text-dim/50 transition-all disabled:opacity-30"
        >
          <Dices size={12} />
          随机 100 位
        </button>
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
          <div>串长度: {S.length} 位</div>
          <div>通信容量: 20 bit</div>
          {S.length <= 20 ? (
            <div className="text-accent-blue">模式: 精确传输（S ≤ 20 位）</div>
          ) : (
            <div className="text-yellow-400">模式: 有损压缩（XOR 校验和）</div>
          )}
        </div>
      )}
    </div>
  )
}
