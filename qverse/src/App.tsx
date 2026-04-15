import QuantumCircuit from './components/QuantumCircuit';
import BlochSphere from './components/BlochSphere';
import AIAssistant from './components/AIAssistant';
import Dashboard from './components/Dashboard';
import { useQuantumStore } from './store/quantumStore';

export default function App() {
  const circuitSteps        = useQuantumStore(s => s.circuitSteps);
  const entanglementStrength = useQuantumStore(s => s.entanglementStrength);
  const isMeasured          = useQuantumStore(s => s.isMeasured);

  return (
    <div className="min-h-screen p-6 grid grid-cols-1 md:grid-cols-12 gap-6 relative">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-50 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <header className="md:col-span-12 flex justify-between items-center mb-2">
        <div>
          <h1 className="text-4xl font-extrabold text-gradient drop-shadow-[0_0_10px_rgba(0,243,255,0.8)] tracking-wide">
            QVerse
          </h1>
          <p className="text-gray-400 mt-1">Interactive Quantum Entanglement Lab</p>
        </div>
        <div className="glass-panel px-4 py-2 text-sm text-cyan-300 font-mono glow-blue flex gap-4">
          <span>
            {isMeasured ? '⚡ MEASURED' : circuitSteps.length === 0 ? '◎ INITIALIZED' : '▶ SIMULATING'}
          </span>
          <span className="text-gray-500">|</span>
          <span>Gates: {circuitSteps.length}</span>
          <span className="text-gray-500">|</span>
          <span>Entanglement: {entanglementStrength}%</span>
        </div>
      </header>


      <div className="md:col-span-8 flex flex-col gap-6 mb-12">
        <div className="glass-panel p-6 glow-blue min-h-[340px] flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400 flex items-center gap-2">
             Quantum Circuit Builder
          </h2>
          <QuantumCircuit />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
          <div className="glass-panel p-4 relative flex flex-col items-center bg-gray-900/40">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Qubit 0 | Control Line</h3>
            <div className="flex-1 w-full"><BlochSphere qubitIndex={0} /></div>
          </div>
          <div className="glass-panel p-4 relative flex flex-col items-center bg-gray-900/40">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Qubit 1 | Target Line</h3>
            <div className="flex-1 w-full"><BlochSphere qubitIndex={1} /></div>
          </div>
        </div>
        
        <div className="glass-panel p-6 overflow-y-auto max-h-[500px]">
          <Dashboard />
        </div>
      </div>

      <div className="md:col-span-4 self-start sticky top-6 flex flex-col gap-6">
        <AIAssistant />
        
        <div className="glass-panel p-4 bg-gray-900/60 border-t-2 border-purple-500/30">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-bold">Project Team</h4>
          <div className="space-y-2">
            <div className="flex flex-col">
              <span className="text-[9px] text-purple-400 font-bold uppercase">Team Lead</span>
              <span className="text-sm text-gray-200 font-medium">Medicharla Shanmukheswar</span>
            </div>
            <div className="h-[1px] bg-gray-800 w-full my-1" />
            <div className="flex flex-col">
              <span className="text-[9px] text-cyan-400 font-bold uppercase">Researchers</span>
              <ul className="text-xs text-gray-400 space-y-1 mt-1">
                <li>Penumatsa Bala Chandrika</li>
                <li>Sri Sai Sritha Bhupathiraju</li>
                <li>Sripati Venkata Satya Mohith</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
