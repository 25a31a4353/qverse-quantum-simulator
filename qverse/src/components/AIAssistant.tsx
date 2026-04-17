import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuantumStore } from '../store/quantumStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, Brain, Info, History, Sparkles } from 'lucide-react';
import { getAIResponse, ChatMessage, AIContext } from '../services/aiService';

type Message = { role: 'user' | 'assistant'; text: string; timestamp: Date };

/**
 * Helper to highlight quantum keywords in responses
 */
const QuantumText = ({ text }: { text: string }) => {
  const terms = [
    '|0⟩', '|1⟩', '|00⟩', '|01⟩', '|10⟩', '|11⟩', 'ψ', 'alpha', 'beta',
    'superposition', 'entanglement', 'Bell State', 'Bloch Sphere', 'Hadamard', 'CNOT', 'Pauli-X',
    'measurement', 'collapsed', 'wavefunction', 'probability', 'qubit', 'quantum'
  ];
  
  // Escape special regex characters like |
  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => (
        terms.some(t => t.toLowerCase() === part.toLowerCase()) 
          ? <span key={i} className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{part}</span>
          : part
      ))}
    </span>
  );
};

export default function AIAssistant() {
  const amplitudes           = useQuantumStore(s => s.amplitudes);
  const circuitSteps         = useQuantumStore(s => s.circuitSteps);
  const entanglementStrength = useQuantumStore(s => s.entanglementStrength);
  const isMeasured           = useQuantumStore(s => s.isMeasured);
  const probabilities        = useQuantumStore(s => s.probabilities);

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      text: "Hello! I am your Advanced Quantum Tutor. I'm connected to your live simulator state. How can I help you explore the quantum realm today?", 
      timestamp: new Date() 
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Maintain chat history for LLM (limited to last 10 messages for efficiency)
  const history = useMemo(() => {
    return messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    } as ChatMessage)).slice(-10);
  }, [messages]);

  // Gather current context
  const getContext = (): AIContext => {
    const lastGate = circuitSteps.length > 0 ? circuitSteps[circuitSteps.length - 1] : null;
    let lastOp = 'None';
    if (lastGate) {
      lastOp = lastGate.type === 'CNOT' 
        ? `CNOT (Control: Q${lastGate.control}, Target: Q${lastGate.target})`
        : `${lastGate.type} Gate on Q${lastGate.qubit}`;
    }

    return {
      stateVector: amplitudes.map(a => a.toFixed(3)),
      probabilities: Array.from(probabilities),
      circuitSteps: circuitSteps.map(s => s.type),
      lastOperation: lastOp,
      entanglement: entanglementStrength,
      isMeasured: isMeasured
    };
  };

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = inputVal.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const responseText = await getAIResponse(text, getContext(), history);
      const aiMsg: Message = { role: 'assistant', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "I experienced a decoherence event while processing your request. Could you try asking that again?", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    "What is happening in my circuit?",
    "Explain entanglement to a 5-year old",
    "Predict my measurement outcome",
    "How does the Hadamard gate work?"
  ];

  return (
    <div className="flex flex-col h-[600px] glass-panel bg-black/50 border-cyan-500/30 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)] relative">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(6,182,212,0.1)_0%,_transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/60 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100 uppercase tracking-widest flex items-center gap-2">
                Quantum Tutor AI
                <span className="text-[8px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">EXPERT</span>
            </h3>
            <p className="text-[9px] text-cyan-400/60 font-mono flex items-center gap-1">
                <Zap className="w-2 h-2" /> CORE SYNCED | ADAPTIVE LEARNING ENABLED
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[9px] text-cyan-300 font-mono">Q-STATE ACTIVE</span>
            </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative z-10"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xl ${
                  m.role === 'user'
                    ? 'bg-cyan-600/30 border border-cyan-500/50 text-cyan-50 rounded-tr-none'
                    : 'bg-gray-800/90 border border-gray-700 text-gray-100 rounded-tl-none font-medium'
                }`}>
                  {m.role === 'assistant' ? <QuantumText text={m.text} /> : m.text}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[9px] text-gray-500 font-mono px-1">
                  {m.role === 'assistant' && <Brain className="w-2.5 h-2.5 text-cyan-500/50" />}
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {m.role === 'assistant' && <span className="opacity-50">| ADAPTIVE RESPONSE</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-gray-800/90 border border-gray-700 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
              <span className="ml-2 text-[10px] text-gray-400 font-mono animate-pulse">ANALYZING STATE...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-4 bg-gray-900/80 backdrop-blur-lg border-t border-gray-800 z-10">
        {messages.length < 5 && !isTyping && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInputVal(s); }}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-gray-800/40 border border-gray-700 text-[10px] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-300 transition-all flex items-center gap-1.5 group"
              >
                <Info className="w-3 h-3 group-hover:text-cyan-400" />
                {s}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
            <div className="relative flex-1 group">
                <input
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask your quantum tutor anything..."
                    className="w-full bg-gray-950 border border-gray-800 focus:border-cyan-500/50 rounded-xl px-4 py-3.5 text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600 shadow-inner"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputVal.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-all shadow-lg"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-3 text-[9px] text-gray-600 uppercase tracking-tighter font-semibold">
                <span className="flex items-center gap-1"><History className="w-2.5 h-2.5"/> Context Aware</span>
                <span className="flex items-center gap-1"><Brain className="w-2.5 h-2.5"/> GPT-4o Enhanced</span>
            </div>
            <span className="text-[8px] text-gray-500 font-mono">v2.0 EXPERT TUTOR</span>
        </div>
      </div>
    </div>
  );
}
