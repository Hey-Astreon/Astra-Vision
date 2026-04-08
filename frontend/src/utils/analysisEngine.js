/**
 * Code Analysis Engine - Astra Vision
 * 
 * Provides structured, code-aware analysis for JavaScript.
 */

/**
 * 1. parseCode(fileContent)
 * Extracts structured data from raw JavaScript code using regex.
 * 
 * @param {string} fileContent - Raw source code
 * @returns {Object} Structured metadata
 */
export function parseCode(fileContent) {
  if (!fileContent || typeof fileContent !== 'string') {
    return { functions: [], variables: [], logs: [], returns: [] };
  }

  const functions = [];
  const variables = [];
  const logs = [];
  const returns = [];

  // Function regex patterns
  const patterns = [
    // Standard function declaration: function name(params)
    /function\s+(\w+)\s*\((.*?)\)/g,
    // Arrow function assignment: const name = (params) =>
    /(?:const|let|var)\s+(\w+)\s*=\s*\((.*?)\)\s*=>/g,
    // Method/Property function: name: function(params)
    /(\w+)\s*:\s*function\s*\((.*?)\)/g
  ];

  patterns.forEach(regex => {
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
      if (!functions.find(f => f.name === match[1])) {
        functions.push({
          name: match[1],
          parameters: match[2].split(',').map(p => p.trim()).filter(p => p)
        });
      }
    }
  });

  // Variable declarations: const name = ...
  const varRegex = /(?:const|let|var)\s+(\w+)\s*(?==|;)/g;
  let varMatch;
  while ((varMatch = varRegex.exec(fileContent)) !== null) {
    const name = varMatch[1];
    // Filter out variable names that are actually function names caught above
    if (!functions.find(f => f.name === name)) {
      variables.push(name);
    }
  }

  // Console log usage: console.log(...)
  const logRegex = /console\.log\((.*?)\)/g;
  let logMatch;
  while ((logMatch = logRegex.exec(fileContent)) !== null) {
    logs.push(logMatch[1].trim());
  }

  // Return statements: return ...
  const returnRegex = /return\s+([^;}\n]+)/g;
  let retMatch;
  while ((retMatch = returnRegex.exec(fileContent)) !== null) {
    returns.push(retMatch[1].trim());
  }

  return { functions, variables, logs, returns };
}

/**
 * 2. analyzeCode(parsedData)
 * Production-grade analysis that infers intent, logical flow, and architectural reasoning.
 * 
 * @param {Object} parsedData - Metadata from parseCode
 * @returns {Object|null} Semantic analysis results
 */
export function analyzeCode(parsedData) {
  const { functions, variables, logs, returns } = parsedData;

  // Handle empty or low-signal input as per Edge Case requirements
  if (functions.length === 0 && variables.length === 0 && logs.length === 0 && returns.length === 0) {
    return null;
  }

  // 1. Domain & Intent Inference Layer
  // We combine signals from identifiers to determine the "Why" behind the code.
  const allIdentifiers = [
    ...functions.map(f => f.name),
    ...variables,
    ...returns,
    ...logs
  ].join(" ").toLowerCase();

  const domainMap = [
    { keys: ['login', 'auth', 'user', 'token', 'pass', 'sign'], domain: 'Identity & Security', usage: 'Managing who can access the application and protecting their information.', reasoning: 'This code isolates sensitive verification steps from the rest of the application logic.' },
    { keys: ['calc', 'sum', 'total', 'math', 'price', 'tax'], domain: 'Financial/Mathematical Logic', usage: 'Performing precise calculations for e-commerce, banking, or data processing.', reasoning: 'Using functions here ensures that the math is done consistently every time a value is processed.' },
    { keys: ['toggle', 'handle', 'show', 'hide', 'render', 'click'], domain: 'User Interface Interaction', usage: 'Reacting to user actions and updating what they see on their screen.', reasoning: 'This modular approach allows the UI to update specific sections without reloading the entire page.' },
    { keys: ['fetch', 'api', 'axios', 'request'], domain: 'External Data Communication', usage: 'Talking to outside servers to get real-time information or save data permanently.', reasoning: 'By using specialized functions for networking, the code stays responsive while waiting for server answers.' },
    { keys: ['store', 'db', 'save', 'item', 'local'], domain: 'Data Persistence & Storage', usage: 'Remembering preferences or progress even after the user closes their browser.', reasoning: 'Separating data storage ensures the application can "wake up" with the same state it had previously.' }
  ];

  let detected = domainMap.find(d => d.keys.some(k => allIdentifiers.includes(k))) || {
    domain: 'General Logic Flow',
    usage: 'Coordinating basic tasks and data movement within a module.',
    reasoning: 'The code is structured to execute a sequential set of instructions for clean data handling.'
  };

  // 2. Step-by-Step Logic Flow
  const flow = [];
  if (variables.length > 0) flow.push(`The engine initializes ${variables.length} piece(s) of internal state.`);
  functions.forEach(f => {
    flow.push(`It establishes a reusable worker named '${f.name}' that ${f.parameters.length > 0 ? 'processes input data (' + f.parameters.join(', ') + ')' : 'executes a internal routine'}.`);
  });
  if (logs.length > 0) flow.push(`It publishes execution signals (logs) at ${logs.length} different points.`);
  if (returns.length > 0) flow.push(`Finally, it produces ${returns.length} result(s) to be consumed by other parts of the system.`);

  // 3. Concept Extraction
  const concepts = [];
  if (functions.length > 0) concepts.push("Modular Functions");
  if (variables.length > 0) concepts.push("Data Capture");
  if (returns.length > 0) concepts.push("Output Transformation");
  if (logs.length > 0) concepts.push("Telemetry & Monitoring");

  // 4. Common Mistakes Detection
  const mistakes = [];
  if (functions.length > 0 && functions.every(f => f.parameters.length === 0)) {
    mistakes.push("Over-reliance on global state: Functions rarely take inputs, making them harder to reuse.");
  }
  if (returns.length === 0 && functions.length > 0) {
    mistakes.push("The 'Void' trap: Functions are performing actions but not returning results, which might confuse other modules.");
  }
  if (logs.length > functions.length * 2) {
    mistakes.push("Log pollution: Too much output can hide actual errors during production execution.");
  }
  if (mistakes.length === 0) mistakes.push("Assuming code runs instantly: Forgetting that some operations (like networking) take time to complete.");

  return {
    purpose: `This code implements ${detected.domain} logic. Its primary goal is ${detected.usage.toLowerCase()}`,
    flow: flow,
    concepts: concepts,
    inputs: functions.flatMap(f => f.parameters).join(", ") || "Static execution context",
    outputs: returns.slice(0, 3).join(", ") + (returns.length > 3 ? "..." : "") || "Internal state updates only",
    reasoning: `The developer used this structure because: ${detected.reasoning}`,
    realWorldUsage: detected.usage,
    commonMistakes: mistakes
  };
}

/**
 * 3. generateExplanation(analysis)
 * Mentor-tone generation that follows a strict educational structure.
 * 
 * @param {Object|null} analysis - Output from analyzeCode
 * @returns {Object} Final strict structured explanation
 */
export function generateExplanation(analysis) {
  // Edge Case: Handling empty or non-analyzable code
  if (!analysis) {
    return {
      overview: "This code does not contain enough structure to analyze.",
      breakdown: [],
      keyConcepts: [],
      reasoning: "",
      realWorldUsage: "",
      commonMistakes: [],
      analogy: "",
      summary: ""
    };
  }

  // Determine an Analogy only if it fits naturally
  let analogy = "";
  if (analysis.concepts.includes("Modular Functions") && analysis.flow.length > 4) {
    analogy = "Think of this code like a specialized crew in a restaurant kitchen: different people (functions) handle different ingredients to produce a finished meal.";
  } else if (analysis.inputs === "Static execution context") {
    analogy = "It's like an automated alarm clock: once set, it follows a script without needing you to tell it what to do every morning.";
  }

  return {
    overview: `Hello! I've analyzed this implementation. Essentially, ${analysis.purpose}`,
    breakdown: analysis.flow,
    keyConcepts: analysis.concepts,
    reasoning: analysis.reasoning,
    realWorldUsage: analysis.realWorldUsage,
    commonMistakes: analysis.commonMistakes,
    analogy: analogy,
    summary: `In short, this is a ${analysis.concepts.join(" and ")} implementation designed for ${analysis.realWorldUsage.toLowerCase()}`
  };
}

/**
 * 4. explainCode(fileContent)
 * The main orchestrator that combines all layers.
 * 
 * @param {string} fileContent - Raw source code
 * @returns {Object} Complete explanation
 */
export function explainCode(fileContent) {
  // Handle empty or invalid input safely
  if (!fileContent || fileContent.trim() === '') {
    return {
      overview: "No content provided for analysis.",
      keyPoints: ["Please select a non-empty file to begin analysis."],
      summary: "Input is empty."
    };
  }

  try {
    const parsedData = parseCode(fileContent);
    const analysis = analyzeCode(parsedData);
    return generateExplanation(analysis);
  } catch (error) {
    console.error("Analysis Engine Error:", error);
    return {
      overview: "An error occurred during code analysis.",
      keyPoints: ["The code structure might be complex or invalid JS.", "Check the console for more details."],
      summary: "Analysis failed due to a structural error."
    };
  }
}
