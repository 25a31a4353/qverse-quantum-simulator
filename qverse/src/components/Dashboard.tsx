import { useQuantumStore } from '../store/quantumStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const probabilities = useQuantumStore(state => state.probabilities);
  const entanglementStrength = useQuantumStore(state => state.entanglementStrength);
  const historyLogs = useQuantumStore(state => state.historyLogs);

  const data = [
    { name: '|00⟩', probability: probabilities[0] },
    { name: '|01⟩', probability: probabilities[1] },
    { name: '|10⟩', probability: probabilities[2] },
    { name: '|11⟩', probability: probabilities[3] },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full text-white">
      {/* Probability Chart */}
      <div className="flex flex-col bg-gray-950/40 p-4 rounded-xl border border-gray-800/50">
        <h3 className="text-cyan-400 font-black text-xs uppercase tracking-[0.2em] mb-4">Probability Distribution</h3>
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                stroke="#475569" 
                fontSize={10} 
                tick={{ fill: '#94a3b8', fontWeight: 'bold' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tick={{ fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} 
                contentStyle={{ background: '#0f172a', border: '1px solid #1e3a8a', borderRadius: '8px' }} 
              />
              <Bar dataKey="probability" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={800}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.probability >= 50 ? 'url(#activeGrad)' : entry.probability > 0 ? '#1e40af' : '#1e293b'} 
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Metrics & Logs */}
      <div className="flex flex-col gap-4">
        <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-purple-400 font-bold text-sm tracking-widest uppercase">Entanglement Meter</span>
            <span className="text-purple-300 font-mono font-bold text-lg">{entanglementStrength}%</span>
          </div>
          
          <div className="w-full bg-gray-900 rounded-full h-4 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] relative border border-gray-800">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${entanglementStrength}%` }}
              transition={{ type: 'spring', stiffness: 40, damping: 15 }}
              className="bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-400 h-full relative"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            </motion.div>
          </div>
          
          <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
            <span className={entanglementStrength === 0 ? 'text-cyan-400 animate-pulse' : ''}>No Entanglement</span>
            <span className={entanglementStrength === 100 ? 'text-purple-400 animate-pulse font-extrabold' : ''}>Max Entanglement</span>
          </div>
        </div>

        <div className="flex-1 bg-[#0a0f1e]/80 border border-gray-800/60 rounded-xl p-4 overflow-y-auto shadow-inner h-[280px] custom-scrollbar">
          <h3 className="text-gray-500 text-[10px] mb-3 uppercase font-black tracking-[0.2em] border-b border-gray-800 pb-2">Full Operation Log</h3>
          <ul className="text-xs font-mono space-y-2.5">
            {historyLogs.map((log, index) => (
              <motion.li 
                key={index} 
                initial={{ opacity: 0, x: -5 }} 
                animate={{ opacity: 1, x: 0 }}
                className="group flex gap-2 border-l-2 border-gray-800 pl-3 hover:border-cyan-500 transition-colors py-0.5"
              >
                <span className="text-gray-700 shrink-0 font-bold w-12 text-[9px] mt-0.5">{`STEP ${index}`}</span>
                <span className="text-blue-100/90 leading-relaxed group-hover:text-cyan-300 transition-colors break-all">
                  {log}
                </span>
              </motion.li>
            ))}
            {historyLogs.length === 0 && (
              <li className="text-gray-700 italic text-[10px] py-4 text-center">Waiting for first gate...</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
