import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuantumStore, GateStep } from '../store/quantumStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, Brain, Info, History } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; text: string; timestamp: Date };

export default function AIAssistant() {
  const amplitudes           = useQuantumStore(s => s.amplitudes);
  const circuitSteps         = useQuantumStore(s => s.circuitSteps);
  const entanglementStrength = useQuantumStore(s => s.entanglementStrength);
  const isMeasured           = useQuantumStore(s => s.isMeasured);
  const historyLogs          = useQuantumStore(s => s.historyLogs);

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      text: "Greetings. I am your Quantum Analysis Unit. My sensors are calibrated to your circuit's state vector. How can I assist your research today?", 
      timestamp: new Date() 
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamic context for the "AI's Brain"
  const currentContext = useMemo(() => {
    const lastGate = circuitSteps.length > 0 ? circuitSteps[circuitSteps.length - 1] : null;
    const isBellState = entanglementStrength > 90;
    const hasSuperposition = amplitudes.some(a => Math.abs(a) > 0.1 && Math.abs(a) < 0.9);
    
    return {
      stepCount: circuitSteps.length,
      lastAction: lastGate ? (lastGate.type === 'CNOT' ? `CNOT (Q${lastGate.control}→Q${lastGate.target})` : `${lastGate.type} on Q${lastGate.qubit}`) : 'Initialization',
      entanglement: entanglementStrength,
      isBellState,
      hasSuperposition,
      isCollapsed: isMeasured,
      stateVector: amplitudes.map(a => a.toFixed(3))
    };
  }, [circuitSteps, entanglementStrength, amplitudes, isMeasured]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const generateAIResponse = async (query: string): Promise<string> => {
    const q = query.toLowerCase();
    
    // 1. Context Analysis Requests
    if (q.includes('analyze') || q.includes('current') || q.includes('circuit') || q.includes('doing') || q.includes('happening')) {
      let analysis = `Current Circuit Analysis: You have executed ${currentContext.stepCount} operations. `;
      
      if (currentContext.isCollapsed) {
        analysis += "The system has been measured, collapsing the wavefunction to a definite state. All coherence is lost.";
      } else {
        analysis += `The system is in a ${currentContext.hasSuperposition ? 'superposition' : 'basis'} state. `;
        if (currentContext.entanglement > 0) {
          analysis += `I detect ${currentContext.entanglement}% quantum entanglement. ${currentContext.isBellState ? "This is a maximally entangled Bell State—Alice and Bob are perfectly linked!" : "The qubits are partially correlated."}`;
        } else {
          analysis += "No entanglement is currently present. Qubits are acting as independent entities.";
        }
      }
      return analysis;
    }

    if (q.includes('entangle') && (q.includes('how') || q.includes('create') || q.includes('100%'))) {
      return "To reach 100% entanglement (a Bell State), you must: 1. Apply a Hadamard gate to Q0 to create superposition. 2. Apply a CNOT gate with Q0 as control and Q1 as target. This links their probabilities into a single shared state!";
    }

    if (q.includes('wave') || q.includes('particle') || q.includes('duality')) {
      return "Wave-particle duality is the core of quantum mechanics. Particles behave like waves (superposition) until they are observed (measurement). In our lab, the amplitudes you see represent the 'wave' aspect of the qubits.";
    }

    // 2. Technical Physics Knowledge
    if (q.includes('entanglement') || q.includes('spooky')) {
      return "Quantum entanglement is a non-local correlation where the state of one qubit cannot be described independently of the other. Einstein called it 'spooky action at a distance.' In this lab, CNOT gates are the primary mechanism for creating these links.";
    }

    if (q.includes('hadamard') || q.includes('h gate')) {
      return "The Hadamard gate (H) is the fundamental operator for superposition. It maps the basis states |0⟩ and |1⟩ to an equal mix of both. Mathematically, it's a 90-degree rotation around the Y-axis followed by a rotation around the X-axis (or simply a rotation around the X+Z axis).";
    }

    if (q.includes('bloch') || q.includes('sphere')) {
      return "The Bloch Sphere is a visual representation of a single qubit's state space. Every point on the sphere's surface is a pure state. Superposition states lie on the equator, while |0⟩ and |1⟩ are the poles. Entangled states can't be fully represented on a single sphere because they share information!";
    }

    if (q.includes('cnot') || q.includes('controlled')) {
      return "CNOT (Controlled-NOT) is a 2-qubit gate. It flips the target qubit if and only if the control qubit is |1⟩. When the control is in superposition, CNOT creates entanglement, linking the futures of both qubits.";
    }

    if (q.includes('measure') || q.includes('collapse')) {
      return "Measurement forces the quantum system to 'choose' a classical state. According to the Born Rule, the probability of an outcome is the square of its amplitude's magnitude. Once measured, the superposition is destroyed.";
    }

    // 3. Logic/Command Handling
    if (q.includes('help') || q.includes('what can you do')) {
      return "I can analyze your circuit in real-time, explain complex quantum phenomena, calculate probabilities, or guide you through creating Bell States. Try asking 'Explain my current entanglement' or 'What does the X gate do?'.";
    }

    if (q.includes('who made you') || q.includes('team')) {
      return "I was developed by the QVerse project team: Shanmukheswar (Lead), Chandrika, Sritha, and Mohith. My purpose is to bridge the gap between abstract math and intuitive quantum understanding.";
    }

    if (q.includes('joke') || q.includes('funny')) {
      return "Why can't you trust a quantum physicist? Because they're always in two states of mind... and when you check, they change their story!";
    }

    // 4. Default Intelligent Fallback
    return "That is a profound question. In the quantum realm, such inquiries often lead to deeper understanding of wave-particle duality and non-locality. While I process that specific query, would you like me to analyze how your current amplitudes [ " + currentContext.stateVector.join(', ') + " ] relate to your circuit's complexity?";
  };

  const handleSend = async () => {
    const text = inputVal.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate "Neural Processing"
    setTimeout(async () => {
      const responseText = await generateAIResponse(text);
      const aiMsg: Message = { role: 'assistant', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 1000);
  };

  const suggestions = [
    "Analyze my current circuit",
    "Explain entanglement",
    "How to make a Bell State?",
    "What is the Bloch sphere?"
  ];

  return (
    <div className="flex flex-col h-[580px] glass-panel bg-black/40 border-cyan-500/20 overflow-hidden shadow-2xl shadow-cyan-500/10">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider">Quantum Core AI</h3>
            <p className="text-[10px] text-cyan-400/70 font-mono">Status: SYNCED WITH Q-ENGINE</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-[9px] text-gray-400 font-mono">
                COMPUTE: {Math.round(Math.random() * 5 + 95)}%
            </div>
            <div className="px-2 py-1 rounded bg-cyan-950/30 border border-cyan-500/20 text-[9px] text-cyan-400 font-mono">
                LATENCY: 14ms
            </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,_rgba(6,182,212,0.05)_0%,_transparent_70%)]"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] group`}>
                <div className={`px-4 py-3 rounded-2xl text-sm shadow-lg ${
                  m.role === 'user'
                    ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-50 shadow-cyan-500/5 rounded-tr-none'
                    : 'bg-gray-800/80 border border-gray-700 text-gray-100 shadow-black/20 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
                <div className={`mt-1 text-[9px] text-gray-500 flex items-center gap-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && <Zap className="w-2 h-2 text-cyan-500" />}
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-gray-800/80 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-4 bg-gray-900/40 border-t border-gray-800">
        {messages.length < 4 && !isTyping && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInputVal(s); }}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700 text-[10px] text-gray-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all flex items-center gap-1.5"
              >
                <Info className="w-3 h-3" />
                {s}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Inquire about the quantum state..."
                    className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputVal.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-all"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-[9px] text-gray-600 uppercase tracking-tighter">
            <span className="flex items-center gap-1"><History className="w-2 h-2"/> Full context enabled</span>
            <span className="flex items-center gap-1"><Zap className="w-2 h-2"/> Real-time analysis</span>
        </div>
      </div>
    </div>
  );
}
