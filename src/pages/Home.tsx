import SceneCanvas from '@/components/SceneCanvas'
import ControlPanel from '@/components/ControlPanel'
import ResultPanel from '@/components/ResultPanel'
import StatusBar from '@/components/StatusBar'
import { useSimulationStore } from '@/store/simulationStore'

export default function Home() {
  const { phase } = useSimulationStore()

  return (
    <div className="h-screen w-screen flex flex-col bg-bg overflow-hidden">
      <header className="shrink-0 px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl tracking-wider text-text glow-blue-text">
            OJ 通信题沙盒
          </h1>
          <p className="text-[10px] text-text-dim mt-0.5">
            可视化 Alice–Bob 进程隔离通信 · 20-bit 信道模拟
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-accent-blue" />
            <span className="text-text-dim">Alice</span>
          </div>
          <span className="text-text-dim text-xs">→</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-text-dim">Bob</span>
          </div>
        </div>
      </header>

      <div className="shrink-0 px-5 pb-2">
        <StatusBar />
      </div>

      <div className="flex-1 flex min-h-0 px-5 pb-4 gap-4">
        <div className="flex-[3] min-w-0 relative rounded-xl overflow-hidden border border-border">
          <SceneCanvas phase={phase} />

          <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
            <div className="pointer-events-auto bg-bg/70 backdrop-blur-sm border border-accent-blue/30 rounded-lg px-3 py-1.5">
              <span className="font-display text-xs text-accent-blue glow-blue-text">ALICE</span>
              <span className="text-[10px] text-text-dim ml-2">进程 A</span>
            </div>
            <div className="pointer-events-auto bg-bg/70 backdrop-blur-sm border border-accent-green/30 rounded-lg px-3 py-1.5">
              <span className="font-display text-xs text-accent-green glow-green-text">BOB</span>
              <span className="text-[10px] text-text-dim ml-2">进程 B</span>
            </div>
          </div>
        </div>

        <div className="flex-[1.2] min-w-[280px] max-w-[360px] flex flex-col gap-3 overflow-y-auto">
          <ControlPanel />
          <ResultPanel />
        </div>
      </div>
    </div>
  )
}
