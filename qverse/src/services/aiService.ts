/**
 * AI Service for QVerse
 * Handles communication with LLM (OpenAI-compatible)
 */

export interface AIContext {
  stateVector: string[];
  probabilities: number[];
  circuitSteps: string[];
  lastOperation: string;
  entanglement: number;
  isMeasured: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are an advanced Quantum Computing Assistant embedded in a live simulator.

Your role:
* Explain quantum concepts clearly and accurately
* Help users understand what is happening in the circuit
* Answer questions about qubits, gates, entanglement, measurement, and Bloch sphere

Rules:
* Always prioritize correctness
* Start simple, then go deeper if needed
* Use analogies when helpful
* Relate answers to the current simulation
* If unsure, say so honestly
* If user question is unclear, ask a follow-up question
* Never give vague or generic answers

You are both a teacher and a guide.
Detect user level implicitly: Simple question -> beginner explanation; Technical question -> deeper math explanation.
Explain what each gate is doing in the current circuit and predict outcomes before measurement.`;

export async function getAIResponse(
  userQuery: string,
  context: AIContext,
  history: ChatMessage[]
): Promise<string> {
  // Construct the context string for the AI
  const contextSummary = `
--- CURRENT SIMULATION STATE ---
State Vector (ψ): [${context.stateVector.join(', ')}]
Probabilities (|00⟩, |01⟩, |10⟩, |11⟩): ${context.probabilities.map(p => p + '%').join(', ')}
Circuit Gates: ${context.circuitSteps.length > 0 ? context.circuitSteps.join(' -> ') : 'None'}
Last Operation: ${context.lastOperation}
Entanglement: ${context.entanglement}%
Measurement Status: ${context.isMeasured ? 'COLLAPSED' : 'ACTIVE/COHERENT'}
-------------------------------
`;

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: `${contextSummary}\nUser Question: ${userQuery}` }
  ];

  try {
    // In a real production app, this would be a call to your backend.
    // For this local expert upgrade, we use the OpenAI API directly (requires key).
    // If no key is provided, we fall back to a "Mock Intelligent Response" that 
    // mimics LLM behavior for demonstration purposes.
    
    const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      console.warn("VITE_OPENAI_API_KEY not found. Falling back to local reasoning engine.");
      return mockLLMResponse(userQuery, context);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // or gpt-3.5-turbo
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("AI Service Error:", error);
    return "I encountered a synchronization error with my neural processors. However, looking at your circuit, I see you have " + context.entanglement + "% entanglement. What specifically would you like to know about this state?";
  }
}

/**
 * Mock LLM Response Generator
 * Used when no API Key is provided. Uses the provided context to 
 * generate "perfect" specialized answers.
 */
function mockLLMResponse(query: string, context: AIContext): string {
  const q = query.toLowerCase();
  
  // Logic for specific "Expert" replies based on context
  if (q.includes('happening') || q.includes('now') || q.includes('analyze')) {
    let resp = `Currently, your circuit has ${context.circuitSteps.length} gates. `;
    if (context.isMeasured) {
       resp += "The state has collapsed due to measurement. You are seeing a classical outcome.";
    } else {
       resp += `You have ${context.entanglement}% entanglement. `;
       if (context.entanglement > 90) {
         resp += "You've successfully created a Bell State! Qubit 0 and Qubit 1 are now perfectly correlated.";
       } else if (context.circuitSteps.includes('H')) {
         resp += "I see you've used a Hadamard gate to create superposition.";
       }
    }
    return resp + " Would you like me to explain the math behind the current state vector?";
  }

  // Fallback to a general "expert tutor" style response
  return "As your quantum tutor, I've analyzed your state [ " + context.stateVector.join(', ') + " ]. In quantum mechanics, this represents a linear combination of states. Based on your question about '" + query + "', I'd suggest looking at how the " + (context.lastOperation || 'initial state') + " affected the probability distribution. Do you want the beginner-friendly analogy or the deep Hilbert space explanation?";
}
