import { useSimulationStore, type Phase } from '@/store/simulationStore'

const PHASE_CONFIG: Record<Phase, { label: string; color: string; bgColor: string; width: string }> = {
  idle: { label: '等待输入', color: '#555570', bgColor: 'rgba(85,85,112,0.1)', width: '0%' },
  alice_computing: { label: 'Alice 计算中', color: '#00e5ff', bgColor: 'rgba(0,229,255,0.1)', width: '25%' },
  transmitting: { label: '数据传输中', color: '#aa88ff', bgColor: 'rgba(170,136,255,0.1)', width: '55%' },
  bob_computing: { label: 'Bob 推断中', color: '#39ff14', bgColor: 'rgba(57,255,20,0.1)', width: '80%' },
  complete: { label: '通信完成', color: '#39ff14', bgColor: 'rgba(57,255,20,0.1)', width: '100%' },
}

export default function StatusBar() {
  const { phase } = useSimulationStore()
  const config = PHASE_CONFIG[phase]

  return (
    <div className="bg-surface border border-border rounded-lg px-4 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full transition-colors duration-500"
            style={{
              backgroundColor: config.color,
              boxShadow: phase !== 'idle' ? `0 0 6px ${config.color}` : 'none',
            }}
          />
          <span
            className="font-display text-xs tracking-wider transition-colors duration-500"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
        <div className="flex gap-3 text-[10px] text-text-dim">
          <span className={phase === 'alice_computing' ? 'text-accent-blue' : ''}>① Alice 计算</span>
          <span className={phase === 'transmitting' ? 'text-purple-400' : ''}>② 传输 X</span>
          <span className={phase === 'bob_computing' ? 'text-accent-green' : ''}>③ Bob 推断</span>
          <span className={phase === 'complete' ? 'text-accent-green' : ''}>④ 完成</span>
        </div>
      </div>
      <div className="h-1 bg-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: config.width,
            backgroundColor: config.color,
            boxShadow: phase !== 'idle' ? `0 0 6px ${config.color}` : 'none',
          }}
        />
      </div>
    </div>
  )
}
