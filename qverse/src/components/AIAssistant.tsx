import { useState, useEffect, useRef } from 'react';
import { useQuantumStore } from '../store/quantumStore';
import { motion } from 'framer-motion';

type Message = { role: 'user' | 'ai'; text: string };

const QUICK_SUGGESTIONS = [
  "Explain entanglement",
  "What is the Bloch sphere?",
  "What does Hadamard do?",
  "Analyze my current circuit"
];

/**
 * NOTE FOR PRODUCTION:
 * To integrate a real LLM, use the SYSTEM_PROMPT and context inside getAICompletion
 * to power your API request (e.g., fetch('/api/quantum-ai', { body: JSON.stringify({ context, query }) })).
 */

export default function AIAssistant() {
  const amplitudes           = useQuantumStore(s => s.amplitudes);
  const circuitSteps         = useQuantumStore(s => s.circuitSteps);
  const entanglementStrength = useQuantumStore(s => s.entanglementStrength);
  const isMeasured           = useQuantumStore(s => s.isMeasured);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: "Hello! I'm your Quantum Lab Assistant. I can help you understand the physics behind your circuit. What would you like to explore?" }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getAICompletion = async (userQuery: string) => {
    setIsTyping(true);
    
    // Construct real-time state context
    // Ready for API integration: send state summary and 'userQuery' to LLM provider
    console.log(`[AI-Context] Processing query: "${userQuery}"`);

    try {
      // NOTE: In a production environment, you would use your own backend 
      // or a proxy to call OpenAI/Anthropic. For this demo, we use a 
      // simulated intelligent response generator that mirrors LLM behavior.
      
      await new Promise(r => setTimeout(r, 1200)); // Simulate thinking

      // Simulated Intelligent Response Logic (Fallback for Demo Stability)
      // This is a placeholder for: const res = await fetch('YOUR_API_ENDPOINT', { ... })
      let response = "";
      const q = userQuery.toLowerCase();

      if (q.includes('analyze') || q.includes('my current circuit')) {
        const ent = entanglementStrength > 0 ? `Your qubits are ${entanglementStrength}% entangled. ` : "Your qubits are currently unentangled. ";
        const meas = isMeasured ? "The state has been measured and collapsed." : "The state is currently in a coherent evolution.";
        response = `Let's look at your circuit. You've applied ${circuitSteps.length} gates. ${ent}${meas} The current amplitudes reflect a state vector of [${amplitudes.map(a => a.toFixed(2)).join(', ')}]. Overall, your system is ${entanglementStrength >= 100 ? 'maximally entangled!' : 'evolving as expected.'}`;
      } else if (q.includes('entangle')) {
        response = `Entanglement is a phenomenon where qubits become linked such that the state of one is tied to the other. In your circuit, you have ${entanglementStrength}% entanglement. Using a Hadamard then a CNOT is the classic way to create a Bell State!`;
      } else if (q.includes('hadamard') || q.includes('h gate')) {
        response = "The Hadamard gate (H) is the most common way to create superposition. It rotates the qubit's state vector to the equator of the Bloch sphere, making it a 50/50 mix of |0⟩ and |1⟩.";
      } else if (q.includes('bloch') || q.includes('sphere')) {
        response = "The Bloch sphere is a geometric representation of a qubit's state. The North pole is |0⟩ and the South pole is |1⟩. Any point on the surface is a pure state, while points inside represent mixed or entangled states.";
      } else if (q.includes('circuit') || q.includes('happen')) {
        response = `Currently, your circuit has ${circuitSteps.length} steps. Your state vector is ${isMeasured ? 'fully collapsed' : 'evolving'}. ${entanglementStrength > 0 ? `You've successfully created ${entanglementStrength}% entanglement!` : "Try using H and CNOT to create entanglement."}`;
      } else if (q.length < 5) {
        response = "I'm not sure I fully understood. Are you asking about a specific gate or the current state of your simulation?";
      } else {
        response = "That's an interesting question. Quantum mechanics suggests that at this scale, particles behave as waves of probability. In our simulator, we use the complex state vector to track those waves! Would you like a deeper explanation of the current amplitudes?";
      }

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my knowledge base right now. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = inputVal.trim();
    if (!val) return;
    setMessages(prev => [...prev, { role: 'user', text: val }]);
    setInputVal('');
    getAICompletion(val);
  };

  return (
    <div className="flex flex-col h-[550px] glass-panel p-4 bg-gray-950/40 relative">
      <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest text-[10px]">Quantum AI Assistant</h3>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Context: {entanglementStrength}% Entangled</span>
      </div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-100 rounded-br-none' 
                : 'bg-gray-800/60 border border-gray-700/50 text-gray-200 rounded-bl-none'
            }`}>
              {m.text.split(/(\|0⟩|\|1⟩|entanglement|superposition|Hadamard|Bloch sphere)/gi).map((part, index) => (
                <span key={index} className={
                  part.match(/(\|0⟩|\|1⟩|entanglement|superposition|Hadamard|Bloch sphere)/i) 
                    ? "text-cyan-400 font-bold" 
                    : ""
                }>
                  {part}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800/60 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      {!isTyping && messages.length < 5 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {QUICK_SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => { setInputVal(s); }}
              className="text-[10px] bg-gray-900 border border-gray-700 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-300 px-3 py-1 rounded-full transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask about gate logic or current state..."
          className="w-full bg-gray-900 border border-gray-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm outline-none transition-all pr-12 text-gray-200"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
