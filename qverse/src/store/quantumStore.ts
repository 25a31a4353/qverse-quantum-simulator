import { create } from 'zustand';

// ── Public types ────────────────────────────────────────────────────────────
export type GateType = 'H' | 'X' | 'CNOT';

export type GateStep =
  | { type: 'H'; qubit: 0 | 1 }
  | { type: 'X'; qubit: 0 | 1 }
  | { type: 'CNOT'; control: 0 | 1; target: 0 | 1 };

export type Amplitudes = [number, number, number, number]; // |00⟩ |01⟩ |10⟩ |11⟩

// ── Gate mathematics (real amplitudes are sufficient for H, X, CNOT on |00⟩) ─
const S = 1 / Math.sqrt(2);

function applyHGate(amp: Amplitudes, qubit: 0 | 1): Amplitudes {
  const [a, b, c, d] = amp;
  // qubit=0 → H⊗I,  qubit=1 → I⊗H
  return qubit === 0
    ? [S * (a + c), S * (b + d), S * (a - c), S * (b - d)]
    : [S * (a + b), S * (a - b), S * (c + d), S * (c - d)];
}

function applyXGate(amp: Amplitudes, qubit: 0 | 1): Amplitudes {
  const [a, b, c, d] = amp;
  // qubit=0 → X⊗I (flip Q0),  qubit=1 → I⊗X (flip Q1)
  return qubit === 0 ? [c, d, a, b] : [b, a, d, c];
}

function applyCNOTGate(amp: Amplitudes, control: 0 | 1, target: 0 | 1): Amplitudes {
  const [a, b, c, d] = amp;
  if (control === 0 && target === 1) return [a, b, d, c]; // CNOT Q0→Q1
  if (control === 1 && target === 0) return [a, d, c, b]; // CNOT Q1→Q0
  return amp;
}

function computeProbabilities(amp: Amplitudes): [number, number, number, number] {
  const p = amp.map(v => Math.min(100, Math.round(v * v * 100))) as [number, number, number, number];
  // Fix floating-point rounding so sum == 100
  const delta = 100 - p.reduce((s, v) => s + v, 0);
  if (delta !== 0) p[p.indexOf(Math.max(...p))] += delta;
  return p;
}

// Concurrence C = 2|α₀₀·α₁₁ − α₀₁·α₁₀|  →  ranges [0, 1]
function computeEntanglement(amp: Amplitudes): number {
  const [a, b, c, d] = amp;
  return Math.round(Math.min(1, 2 * Math.abs(a * d - b * c)) * 100);
}

// ── Store types ──────────────────────────────────────────────────────────────
type QuantumStoreState = {
  amplitudes: Amplitudes;
  probabilities: [number, number, number, number];
  entanglementStrength: number;
  isMeasured: boolean;
  historyLogs: string[];
  currentStep: number;
  // Circuit builder
  circuitSteps: GateStep[];
  stateHistory: Amplitudes[]; // stack for undo
  selectedGate: GateType | null;
  cnotPendingControl: 0 | 1 | null;
};

type Store = QuantumStoreState & {
  selectGate: (gate: GateType) => void;
  applyGateToQubit: (qubit: 0 | 1) => void;
  undoLastGate: () => void;
  measure: () => void;
  reset: () => void;
};

// ── Initial state ────────────────────────────────────────────────────────────
const INITIAL: QuantumStoreState = {
  amplitudes: [1, 0, 0, 0],
  probabilities: [100, 0, 0, 0],
  entanglementStrength: 0,
  isMeasured: false,
  historyLogs: ['System initialized: |ψ⟩ = |00⟩'],
  currentStep: 0,
  circuitSteps: [],
  stateHistory: [],
  selectedGate: null,
  cnotPendingControl: null,
};

// ── Store ────────────────────────────────────────────────────────────────────
export const useQuantumStore = create<Store>((set, get) => ({
  ...INITIAL,

  selectGate: (gate) =>
    set((s) => ({
      selectedGate: s.selectedGate === gate ? null : gate,
      cnotPendingControl: null,
    })),

  applyGateToQubit: (qubit) => {
    const {
      selectedGate, amplitudes, isMeasured, cnotPendingControl,
    } = get();
    if (!selectedGate || isMeasured) return;

    let nextAmplitudes: Amplitudes;
    let logEntry: string;
    let newStep: GateStep | null = null;

    if (selectedGate === 'CNOT') {
      if (cnotPendingControl === null) {
        set({ cnotPendingControl: qubit });
        return;
      }
      const control = cnotPendingControl;
      const target = qubit;
      if (control === target) { set({ cnotPendingControl: null }); return; }

      nextAmplitudes = applyCNOTGate(amplitudes, control, target);
      newStep = { type: 'CNOT', control, target };
      logEntry = `CNOT(Q${control}→Q${target})`;
    } else if (selectedGate === 'H') {
      nextAmplitudes = applyHGate(amplitudes, qubit);
      newStep = { type: 'H', qubit };
      logEntry = `Hadamard on Q${qubit}`;
    } else if (selectedGate === 'X') {
      nextAmplitudes = applyXGate(amplitudes, qubit);
      newStep = { type: 'X', qubit };
      logEntry = `Pauli-X on Q${qubit}`;
    } else {
      return;
    }

    // Normalize resulting state vector to maintain numerical stability
    const mag = Math.sqrt(nextAmplitudes.reduce((acc, val) => acc + val * val, 0));
    const normalizedAmplitudes = nextAmplitudes.map(a => mag > 0 ? a / mag : a) as Amplitudes;

    // Capture state summary for the log
    const stateSummary = normalizedAmplitudes
      .map((a, i) => Math.abs(a) > 0.05 ? `${a.toFixed(2)}${['|00⟩', '|01⟩', '|10⟩', '|11⟩'][i]}` : '')
      .filter(Boolean)
      .join(' + ');

    console.log(`[QuantumStore] Applied ${logEntry} | ψ updated.`);

    set((s) => ({
      amplitudes: normalizedAmplitudes,
      probabilities: computeProbabilities(normalizedAmplitudes),
      entanglementStrength: computeEntanglement(normalizedAmplitudes),
      circuitSteps: newStep ? [...s.circuitSteps, newStep] : s.circuitSteps,
      stateHistory: [...s.stateHistory, amplitudes],
      historyLogs: [...s.historyLogs, `${logEntry} → |ψ⟩ ≈ ${stateSummary || '0'}`],
      currentStep: s.currentStep + 1,
      selectedGate: null,
      cnotPendingControl: null,
    }));
  },

  undoLastGate: () => {
    const { circuitSteps, historyLogs } = get();
    if (circuitSteps.length === 0) return;

    const remainingSteps = circuitSteps.slice(0, -1);
    const remainingLogs = historyLogs.slice(0, -1);

    // Recompute everything from initial state to ensure absolute accuracy
    let currentAmp: Amplitudes = [...INITIAL.amplitudes] as Amplitudes;
    
    remainingSteps.forEach((step) => {
      if (step.type === 'H') currentAmp = applyHGate(currentAmp, step.qubit);
      else if (step.type === 'X') currentAmp = applyXGate(currentAmp, step.qubit);
      else if (step.type === 'CNOT') currentAmp = applyCNOTGate(currentAmp, step.control, step.target);
    });

    set({
      amplitudes: currentAmp,
      probabilities: computeProbabilities(currentAmp),
      entanglementStrength: computeEntanglement(currentAmp),
      circuitSteps: remainingSteps,
      historyLogs: remainingLogs,
      stateHistory: [], // No longer strictly needed but kept empty
      currentStep: remainingSteps.length,
      isMeasured: false,
      selectedGate: null,
      cnotPendingControl: null,
    });
  },

  measure: () => {
    const { isMeasured, probabilities, historyLogs, currentStep } = get();
    if (isMeasured) return;
    
    let cumulative = 0;
    let outcome = 0;
    const r = Math.random() * 100;
    for (let i = 0; i < 4; i++) {
        cumulative += probabilities[i];
        if (r <= cumulative) { outcome = i; break; }
    }

    const newAmp: Amplitudes = [0, 0, 0, 0];
    const newProb: [number, number, number, number] = [0, 0, 0, 0];
    newAmp[outcome] = 1;
    newProb[outcome] = 100;
    const binary = outcome.toString(2).padStart(2, '0');

    set({
      amplitudes: newAmp,
      probabilities: newProb,
      isMeasured: true,
      currentStep: currentStep + 1,
      entanglementStrength: 0,
      historyLogs: [...historyLogs, `⚡ Measured |${binary}⟩ — wavefunction collapsed`],
    });
  },

  reset: () => set({ ...INITIAL }),
}));
