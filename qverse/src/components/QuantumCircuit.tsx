import { useState, useEffect } from 'react';
import { useQuantumStore } from '../store/quantumStore';
import type { GateType, GateStep, Amplitudes } from '../store/quantumStore';
import { motion, AnimatePresence } from 'framer-motion';

// ── SVG layout constants ─────────────────────────────────────────────────────
const LABEL_W = 80;   // width reserved for "Q0 |0⟩" labels
const COL_W   = 68;   // width of each circuit step column (spacing)
const Q0_Y    = 42;   // y-center of Q0 wire
const Q1_Y    = 114;  // y-center of Q1 wire
const G_HALF  = 18;   // half-size of a gate box
const SVG_H   = 160;  // total SVG height

// ── Gate appearance ──────────────────────────────────────────────────────────
const GATE_STYLE: Record<GateType, { bg: string; border: string; label: string; glow: string; ghost: string }> = {
  H:    { bg: '#1e3a8a', border: '#22d3ee', label: '#e0f9ff', glow: '0 0 14px #22d3ee', ghost: 'rgba(34,211,238,0.18)' },
  X:    { bg: '#7f1d1d', border: '#f87171', label: '#fff0f0', glow: '0 0 14px #f87171', ghost: 'rgba(248,113,113,0.18)' },
  CNOT: { bg: '#4c1d95', border: '#a78bfa', label: '#f5f3ff', glow: '0 0 14px #a78bfa', ghost: 'rgba(167,139,250,0.18)' },
};

const TOOLBAR_STYLE: Record<GateType, string> = {
  H:    'border-cyan-400 bg-blue-900/80 text-cyan-200 shadow-[0_0_18px_cyan]',
  X:    'border-red-400  bg-red-900/80  text-red-200  shadow-[0_0_18px_#f87171]',
  CNOT: 'border-purple-400 bg-purple-900/80 text-purple-200 shadow-[0_0_18px_#a78bfa]',
};

const GATE_RING: Record<GateType, string> = {
  H:    '#22d3ee',
  X:    '#f87171',
  CNOT: '#a78bfa',
};

// ── State vector display ─────────────────────────────────────────────────────
function fmtAmp(v: number): string {
  const a = Math.abs(v);
  if (a < 0.0005) return '0';
  if (Math.abs(a - 1)      < 0.001) return '';           
  if (Math.abs(a - 0.7071) < 0.001) return '1/√2·';
  return a.toFixed(3) + '·';
}

function StateVector({ amplitudes }: { amplitudes: Amplitudes }) {
  useEffect(() => {
    console.log('[StateVector] Amplitudes changed:', amplitudes);
  }, [amplitudes]);

  const LABELS = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];
  const terms = amplitudes
    .map((a, i) => ({ a, label: LABELS[i] }))
    .filter(({ a }) => Math.abs(a) > 0.0005);
  
  if (terms.length === 0) return <span className="text-gray-500">|0⟩</span>;
  
  return (
    <>
      {terms.map(({ a, label }, i) => (
        <span key={i}>
          {i > 0 && (
            <span className="text-gray-500 mx-1">{a >= 0 ? '+' : '−'}</span>
          )}
          {i === 0 && a < 0 && <span className="text-gray-500">−</span>}
          <span className="text-cyan-300 font-semibold">{fmtAmp(Math.abs(a))}</span>
          <span className="text-purple-300">{label}</span>
        </span>
      ))}
    </>
  );
}

// ── Single gate SVG symbol ───────────────────────────────────────────────────
function GateSymbol({ step, index }: { step: GateStep; index: number }) {
  const cx = LABEL_W + index * COL_W + COL_W / 2;
  const popIn = {
    initial: { opacity: 0, scale: 0.4 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring' as const, stiffness: 340, damping: 18, delay: index * 0.04 },
  };

  if (step.type === 'H' || step.type === 'X') {
    const cy = step.qubit === 0 ? Q0_Y : Q1_Y;
    const s  = GATE_STYLE[step.type];
    return (
      <motion.g {...popIn} style={{ pointerEvents: 'none' }}>
        <rect
          x={cx - G_HALF - 2} y={cy - G_HALF - 2}
          width={(G_HALF + 2) * 2} height={(G_HALF + 2) * 2}
          rx={8} fill={s.ghost} stroke="none"
        />
        <rect
          x={cx - G_HALF} y={cy - G_HALF}
          width={G_HALF * 2} height={G_HALF * 2}
          rx={6} fill={s.bg} stroke={s.border} strokeWidth={2}
          style={{ filter: `drop-shadow(${s.glow})` }}
        />
        <text
          x={cx} y={cy + 6}
          textAnchor="middle"
          fill={s.label} fontSize={15} fontWeight="bold" fontFamily="monospace"
        >
          {step.type}
        </text>
      </motion.g>
    );
  }

  const ctrlY   = step.control === 0 ? Q0_Y : Q1_Y;
  const tgtY    = step.target  === 0 ? Q0_Y : Q1_Y;
  const s       = GATE_STYLE.CNOT;

  return (
    <motion.g {...popIn} style={{ pointerEvents: 'none' }}>
      <line
        x1={cx} y1={Math.min(ctrlY, tgtY)}
        x2={cx} y2={Math.max(ctrlY, tgtY)}
        stroke={s.border} strokeWidth={2}
        style={{ filter: `drop-shadow(${s.glow})` }}
      />
      <circle cx={cx} cy={ctrlY} r={6} fill={s.border} style={{ filter: `drop-shadow(${s.glow})` }} />
      <circle cx={cx} cy={tgtY} r={G_HALF} fill={s.bg} stroke={s.border} strokeWidth={2} style={{ filter: `drop-shadow(${s.glow})` }} />
      <line x1={cx - 6} y1={tgtY} x2={cx + 6} y2={tgtY} stroke={s.border} strokeWidth={2} />
      <line x1={cx} y1={tgtY - 6} x2={cx} y2={tgtY + 6} stroke={s.border} strokeWidth={2} />
    </motion.g>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function QuantumCircuit() {
  const selectedGate        = useQuantumStore(s => s.selectedGate);
  const cnotPendingControl  = useQuantumStore(s => s.cnotPendingControl);
  const circuitSteps        = useQuantumStore(s => s.circuitSteps);
  const amplitudes          = useQuantumStore(s => s.amplitudes);
  const isMeasured          = useQuantumStore(s => s.isMeasured);
  const selectGate          = useQuantumStore(s => s.selectGate);
  const applyGateToQubit    = useQuantumStore(s => s.applyGateToQubit);
  const undoLastGate        = useQuantumStore(s => s.undoLastGate);
  const measure             = useQuantumStore(s => s.measure);
  const reset               = useQuantumStore(s => s.reset);

  const [hoveredRow, setHoveredRow] = useState<0 | 1 | null>(null);

  const handleRowClick = (qubit: 0 | 1) => {
    console.log(`[Circuit] Clicked row for Qubit ${qubit}. SelectedGate: ${selectedGate}`);
    if (!selectedGate || isMeasured) return;
    applyGateToQubit(qubit);
  };

  const numCols  = circuitSteps.length + (selectedGate && !isMeasured ? 1 : 0);
  const svgWidth = Math.max(500, LABEL_W + numCols * COL_W + 60);

  const hintText = () => {
    if (!selectedGate || isMeasured) return null;
    if (selectedGate === 'CNOT') {
      return cnotPendingControl !== null
        ? `Q${cnotPendingControl} = CONTROL → click target qubit row`
        : 'Click a qubit row to set CONTROL qubit';
    }
    return `Click a qubit row to place ${selectedGate} gate`;
  };

  return (
    <div className="flex flex-col w-full h-full text-white gap-4">

      {/* ── Gate Toolbar ────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-gray-500 text-xs uppercase tracking-widest mr-1">Gate</span>
        {(['H', 'X', 'CNOT'] as GateType[]).map(gate => {
          const active = selectedGate === gate;
          return (
            <motion.button
              key={gate}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.91 }}
              onClick={() => {
                console.log(`[Toolbar] Selecting Gate: ${gate}`);
                selectGate(gate);
              }}
              className={`relative px-5 py-1.5 rounded-lg border-2 font-bold text-sm font-mono transition-all ${
                active
                  ? TOOLBAR_STYLE[gate]
                  : 'border-gray-700 bg-gray-900/60 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {active && (
                <motion.span
                  className="absolute inset-0 rounded-lg"
                  style={{ boxShadow: `0 0 0 2px ${GATE_RING[gate]}` }}
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                />
              )}
              {gate}
            </motion.button>
          );
        })}

        <AnimatePresence>
          {hintText() && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-xs text-yellow-500 font-medium ml-2 bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-700/30"
            >
              {hintText()}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Visual Circuit Representation ─────────────────────────────── */}
      <div className="relative bg-[#020617]/40 rounded-xl p-4 border border-gray-800/50 shadow-inner group">
        <svg 
          width={svgWidth} height={SVG_H}
          viewBox={`0 0 ${svgWidth} ${SVG_H}`} 
          className="block"
        >
          {/* Qubit wires */}
          <line x1={LABEL_W} y1={Q0_Y} x2={svgWidth - 20} y2={Q0_Y} stroke="#1e293b" strokeWidth={2} />
          <line x1={LABEL_W} y1={Q1_Y} x2={svgWidth - 20} y2={Q1_Y} stroke="#1e293b" strokeWidth={2} />
          
          {/* Qubit label badges */}
          <text x={10} y={Q0_Y + 5} fill="#67e8f9" fontSize={12} fontWeight="bold" fontFamily="monospace">Q0 |0⟩</text>
          <text x={10} y={Q1_Y + 5} fill="#c4b5fd" fontSize={12} fontWeight="bold" fontFamily="monospace">Q1 |0⟩</text>

          {/* Render Gates */}
          {circuitSteps.map((step, i) => (
            <GateSymbol key={i} step={step} index={i} />
          ))}

          {/* Preview Ghost */}
          {selectedGate && !isMeasured && hoveredRow !== null && (
            <circle 
                cx={LABEL_W + circuitSteps.length * COL_W + COL_W / 2} 
                cy={hoveredRow === 0 ? Q0_Y : Q1_Y} 
                r={G_HALF} fill={GATE_STYLE[selectedGate].ghost} stroke={GATE_STYLE[selectedGate].border} strokeWidth={2} strokeDasharray="4 4" 
                opacity={0.6}
            />
          )}
        </svg>

        {/* ── HIGH-RELIABILITY CLICK OVERLAY (HTML) ── */}
        {selectedGate && !isMeasured && (
            <div className="absolute top-4 bottom-4 left-[80px] right-4 flex flex-col pointer-events-none z-30">
                <div 
                    className={`flex-1 pointer-events-auto cursor-crosshair transition-colors duration-200 ${hoveredRow === 0 ? 'bg-white/5' : ''} relative`}
                    onMouseEnter={() => setHoveredRow(0)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleRowClick(0)}
                >
                    {cnotPendingControl === 0 && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500/40 animate-ping border border-purple-400" />}
                </div>
                <div 
                    className={`flex-1 pointer-events-auto cursor-crosshair transition-colors duration-200 ${hoveredRow === 1 ? 'bg-white/5' : ''} relative`}
                    onMouseEnter={() => setHoveredRow(1)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => handleRowClick(1)}
                >
                    {cnotPendingControl === 1 && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500/40 animate-ping border border-purple-400" />}
                </div>
            </div>
        )}

      </div>

      {/* ── Mathematical Wavefunction Panel ───────────── */}
      <div className="bg-[#0f172a]/80 border border-cyan-900/40 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-cyan-400 text-[10px] uppercase font-bold tracking-widest">Wavefunction |ψ⟩</span>
          <div className="text-[10px] text-gray-500 font-mono italic">
            αᵢ = Amplitude | |αᵢ|² = Probability
          </div>
        </div>
        <div className="flex items-center gap-3 text-lg font-mono py-1 overflow-x-auto">
          <span className="text-gray-400 shrink-0">|ψ⟩ =</span>
          <div className="flex items-center gap-1 min-w-max">
            <StateVector amplitudes={amplitudes} />
          </div>
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mt-auto">
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={measure}
          disabled={circuitSteps.length === 0 || isMeasured}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg font-bold text-sm
            shadow-[0_0_16px_rgba(239,68,68,0.4)] transition-all disabled:opacity-35 disabled:cursor-not-allowed"
        >
          ⚡ MEASURE
        </motion.button>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={undoLastGate}
            disabled={circuitSteps.length === 0}
            className="px-4 py-2 border border-yellow-600/50 text-yellow-400 rounded-lg text-sm
              hover:bg-yellow-900/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ↩ Undo
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={reset}
            className="px-4 py-2 border border-gray-600 text-gray-400 rounded-lg text-sm
              hover:bg-gray-800 hover:text-gray-200 transition-all font-medium"
          >
            ✕ Reset
          </motion.button>
        </div>
      </div>
    </div>
  );
}
