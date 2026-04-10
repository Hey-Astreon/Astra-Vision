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

  // Variable declarations: const name = ... or const { x } = ...
  const varRegex = /(?:const|let|var)\s+({?\s*[\w\s,]+\s*}?)\s*(?==|;)/g;
  let varMatch;
  while ((varMatch = varRegex.exec(fileContent)) !== null) {
    let names = varMatch[1].replace(/[{}]/g, '').split(',').map(n => n.trim());
    names.forEach(name => {
      // Filter out variable names that are actually function names caught above
      if (name && !functions.find(f => f.name === name)) {
        variables.push(name);
      }
    });
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
 * Phase 1.5: Confidence-based inference, Data-Flow tracking, and Difficulty awareness.
 * 
 * @param {Object} parsedData - Metadata from parseCode
 * @param {string} fileContent - Raw source code for pattern matching
 * @returns {Object|null} Semantic analysis results
 */
export function analyzeCode(parsedData, fileContent = "") {
  const { functions, variables, logs, returns } = parsedData;

  // Handle empty or low-signal input as per Edge Case requirements
  if (functions.length === 0 && variables.length === 0 && logs.length === 0 && returns.length === 0) {
    return null;
  }

  // 1. Difficulty Detection
  // Basic: Single function, simple logic. Intermediate: Multi-function or complex operations.
  const isIntermediate = functions.length > 1 || variables.length > 3 || (functions.length === 1 && functions[0].parameters.length > 3);
  const difficultyLevel = isIntermediate ? "intermediate" : "basic";

  // 2. Confidence-Based Domain Inference
  const allIdentifiers = [
    ...functions.map(f => f.name),
    ...variables,
    ...returns,
    ...logs
  ].join(" ").toLowerCase();

  const domainMap = [
    { threshold: 2, keys: ['login', 'auth', 'user', 'token', 'pass', 'sign'], domain: 'Identity & Security', usage: 'Managing authenticated access.', reasoning: 'Isolation of user secrets ensures security boundaries.' },
    { threshold: 2, keys: ['calc', 'sum', 'total', 'math', 'price', 'tax'], domain: 'Business Logic', usage: 'Processing mathematical transformations for commerce.', reasoning: 'Encapsulating math ensures precision and auditability.' },
    { threshold: 2, keys: ['toggle', 'handle', 'show', 'hide', 'render', 'click'], domain: 'UI Interactivity', usage: 'Updating the visual state based on user actions.', reasoning: 'Reacting to events keeps the user experience dynamic.' },
    { threshold: 1, keys: ['fetch', 'api', 'axios', 'request'], domain: 'Data Communication', usage: 'Fetching or pushing data to remote services.', reasoning: 'Outsourcing tasks to specialized networking functions keeps apps fast.' },
    { threshold: 2, keys: ['store', 'db', 'save', 'item', 'local'], domain: 'Data Persistence', usage: 'Persisting state across browser sessions.', reasoning: 'Reliable storage allows applications to maintain context over time.' }
  ];

  // Logic to prevent "hallucination": Count matches.
  let detected = null;
  let isConfident = false;
  for (const d of domainMap) {
    const matchCount = d.keys.filter(k => allIdentifiers.includes(k)).length;
    if (matchCount >= d.threshold) {
      detected = d;
      isConfident = true;
      break;
    }
  }

  if (!detected) {
    detected = {
      domain: 'General Logic',
      usage: 'standard sequence of instructions.',
      reasoning: 'Clean, linear logic execution.'
    };
  }

  // 3. Truth-First Relationship Detection
  const relationships = [];
  if (functions.length > 1) {
    relationships.push("Modular separation: Logic is organized into specialized blocks.");
    if (functions.length > 2) {
      relationships.push("Architectural layering: Functions manage separate concerns.");
    }
  }

  // 4. Data Flow Analysis (Input -> Processing -> Output)
  const flow = [];
  const inputsArr = functions.flatMap(f => f.parameters);
  const inputs = inputsArr.join(", ") || "No external parameters";
  
  if (inputs !== "No external parameters") {
    flow.push(`Input stage: Data enters the system through the parameters: ${inputs}.`);
  } else {
    flow.push("Static stage: The code operates on internal data without needing external input.");
  }

  if (variables.length > 0) {
    flow.push(`Transformation stage: The code uses ${variables.length} variable(s) (${variables.slice(0, 3).join(', ')}) to store and modify information.`);
  }

  if (logs.length > 0) {
    flow.push(`Observability stage: It uses ${logs.length} log(s) to monitor the internal values during execution.`);
  }

  if (returns.length > 0) {
    flow.push(`Output stage: The final result (${returns.slice(0, 2).join(', ')}) is returned to be used by other parts of your app.`);
  }

  // 5. Common Mistakes (Fact-based)
  const mistakes = [];
  if (functions.length > 0 && functions.some(f => f.parameters.length === 0 && returns.length > 0)) {
    mistakes.push("Scope confusion: Using global data inside functions instead of passing it as an argument.");
  }
  if (returns.length === 0 && functions.length > 0) {
    mistakes.push("Missing output: The function performs work but 'forgets' to return the result.");
  }

  // 6. Confidence Level
  // High: complete lifecycle (func + return + log). Medium: core logic (func + return). Low: partial.
  let confidenceLevel = "low";
  if (functions.length > 0 && returns.length > 0) {
    confidenceLevel = logs.length > 0 ? "high" : "medium";
  }

  // 7. Strict Behavioral Inference & Educational Precision
  let behavior = "logic flow";
  let confidenceScore = 0;
  let behaviorDetails = [];
  let concreteExamples = [];
  const returnStr = returns.join(" ").toLowerCase();
  
  // Specific Behavior Mapping & Educational Layer
  if (returnStr.includes("+")) {
    const hasStrings = returnStr.includes('"') || returnStr.includes("'") || returnStr.includes("`") || allIdentifiers.includes("name") || allIdentifiers.includes("msg");
    const hasMath = allIdentifiers.includes("sum") || allIdentifiers.includes("total") || allIdentifiers.includes("price") || allIdentifiers.includes("tax");
    
    if (hasStrings && !hasMath) {
      behavior = "STRING_BUILDER";
      confidenceScore = 95;
      behaviorDetails = [
        "First, it takes your text pieces and variables.",
        "Then, it joins them together in the exact order you provided.",
        "Finally, it creates a single, combined message."
      ];
    } else if (hasMath && !hasStrings) {
      behavior = "MATH_TRANSFORM";
      confidenceScore = 95;
      behaviorDetails = [
        "First, it identifies the numeric values for calculation.",
        "Then, it applies the mathematical operation (+, -, *, /).",
        "Finally, it produces a single numeric result."
      ];
    } else {
      behavior = "COMBINER";
      confidenceScore = 90;
      behaviorDetails = [
        "First, it looks at the two items you're joining.",
        "If both are numbers, it will ADD them like a calculator.",
        "If even one is text, it will JOIN them together like a label maker."
      ];
      concreteExamples = [
        { title: "Addition Case", input: "5 + 5", result: "10", note: "Pure math" },
        { title: "Concatenation Case", input: "'5' + 5", result: "'55'", note: "JavaScript joins them as text when quotes are detected." }
      ];
    }
  } else if (fileContent.includes("fetch") || fileContent.includes("axios")) {
    behavior = "DATA_FETCH";
    confidenceScore = 95;
    behaviorDetails = [
      "First, it reaches out to the URL you provided.",
      "Then, it waits for the server to send information back.",
      "Finally, it translates that information into a format your code can use (like JSON)."
    ];
  } else if (returnStr.includes(".map") || returnStr.includes(".filter")) {
    behavior = "LIST_TRANSFORMATION";
    confidenceScore = 95;
    behaviorDetails = [
      "First, it looks at your list of items one by one.",
      "Then, it applies your logic to each individual item.",
      "Finally, it builds a brand new list with the updated or filtered items."
    ];
  }
  
  // 8. Fact-Based Risk Assessment (Pedagogical Focus)
  const risks = [];
  if (behavior === "MATH_TRANSFORM" || behavior === "COMBINER") {
    if (returnStr.includes("+")) {
      risks.push(`Result confusion: If you pass "5" and 5, your result becomes "55" instead of 10. Always double-check your data types!`);
    }
  }
  if (returnStr.includes(".") && !returnStr.includes("(") && (returnStr.includes("obj") || returnStr.includes("item") || returnStr.includes("data"))) {
    risks.push("Missing data crash: If your object is empty when you try to access a property (like .name), the whole app will stop.");
  }

  // 9. Pattern Detection (Evidence-based & Humble tone)
  const hasSideEffects = logs.length > 0 || fileContent.includes("fetch") || fileContent.includes("axios") || fileContent.includes("useState") || fileContent.includes("useEffect");
  const isPure = functions.length > 0 && !hasSideEffects;
  
  const designPattern = isPure ? "it appears to be a Stateless Utility" : (hasSideEffects ? "it appears to handle Interactive Logic" : null);
  const devInsight = isPure 
    ? "Predictable Data: This code appears to be 'pure'. It treats inputs predictably and doesn't change anything outside itself, which prevents bugs."
    : (hasSideEffects ? "Active Communication: This code manages external signals (like logs or servers) to coordinate with systems outside this file." : null);

  // 10. Conditional Learning Hints
  const learningHints = [];
  if (logs.length === 0 && functions.length > 0) learningHints.push("Experiment: Add a console.log() to track how data moves through your function.");
  if (variables.length === 0 && returns.length > 0) learningHints.push("Try this: Capture your intermediate result in a 'const' variable for better readability.");

  // 11. Fact-Based Concepts
  const conceptDescriptions = {
    "Functions": "Reusable logic blocks.",
    "State": "Local data storage.",
    "Logic Chaining": "Multi-step processing.",
    "Observability": "Execution tracking via logs."
  };

  const activeConcepts = ["Functions"];
  if (variables.length > 0) activeConcepts.push("State");
  if (isIntermediate) activeConcepts.push("Logic Chaining");
  if (logs.length > 0) activeConcepts.push("Observability");

  const enhancedConcepts = activeConcepts.map(c => `${c} – ${conceptDescriptions[c]}`);

  return {
    purpose: isConfident ? `To implement ${detected.domain} logic.` : "To execute a sequence of instructions.",
    behavior,
    behaviorDetails,
    concreteExamples,
    confidenceScore,
    risks,
    designPattern,
    devInsight,
    flow,
    concepts: enhancedConcepts,
    inputs,
    outputs: returns.join(", ") || "No final data produced",
    reasoning: isConfident ? detected.reasoning : "Clean, step-by-step logic execution.",
    realWorldUsage: isConfident ? detected.usage : null,
    commonMistakes: mistakes.length > 0 ? mistakes : [],
    difficultyLevel,
    relationships,
    confidenceLevel,
    learningHints
  };
}

/**
 * 3. generateExplanation(analysis)
 * Phase 1.5: Difficulty-based tone and strict analogy control.
 * 
 * @param {Object|null} analysis - Output from analyzeCode
 * @returns {Object} Final strict structured explanation
 */
export function generateExplanation(analysis) {
  if (!analysis) return null;

  // 1. Truth-First Behavioral Labeling
  const behaviorLabels = {
    "MATH_TRANSFORM": "mathematical transformations",
    "STRING_BUILDER": "text and message construction",
    "COMBINER": "combining different types of data (like numbers and text)",
    "DATA_FETCH": "external data communication",
    "LIST_TRANSFORMATION": "list transformation logic",
    "logic flow": "standard logic flow"
  };

  // 2. Precise Analogy Engine
  let analogy = null;
  if (analysis.confidenceScore >= 90) {
    if (analysis.behavior === "MATH_TRANSFORM") analogy = "It acts like a digital calculator: transforming numeric inputs into a calculated result.";
    else if (analysis.behavior === "STRING_BUILDER") analogy = "It acts like a label maker: assembling various text pieces into a final message.";
    else if (analysis.behavior === "COMBINER") analogy = "It act as a 'Value Combiner': it's smart enough to either add numbers or join text, depending on what you give it.";
    else if (analysis.behavior === "DATA_FETCH") analogy = "It acts like a courier: requesting specific information from a remote location and bringing it back.";
  }

  // 3. Language Softening Layer
  const isHighConf = analysis.confidenceLevel === "high";
  const hedge = isHighConf ? "" : "appears to ";

  return {
    purpose: analysis.purpose,
    overview: `This ${analysis.difficultyLevel} logic ${hedge}handles ${behaviorLabels[analysis.behavior] || "general operations"}.`,
    breakdown: analysis.flow,
    behaviorDetails: analysis.behaviorDetails,
    concreteExamples: analysis.concreteExamples,
    keyConcepts: analysis.concepts,
    reasoning: analysis.designPattern ? `Architecture: This ${analysis.designPattern}. ${analysis.reasoning}` : analysis.reasoning,
    realWorldUsage: analysis.realWorldUsage,
    commonMistakes: analysis.commonMistakes,
    risks: analysis.risks,
    devInsight: analysis.devInsight,
    analogy: analogy,
    summary: `Astra Verdict: ${analysis.difficultyLevel} script focused on ${behaviorLabels[analysis.behavior] || "logic steps"}.`,
    difficultyLevel: analysis.difficultyLevel,
    relationships: analysis.relationships,
    confidenceLevel: analysis.confidenceLevel,
    learningHints: analysis.learningHints
  };
}

/**
 * 4. explainCode(fileContent)
 * The main orchestrator that combines all layers.
 * Performs end-to-end analysis and returns a unified safe structure.
 * 
 * @param {string} fileContent - Raw source code
 * @returns {Object} Complete explanation with hard validation
 */
export function explainCode(fileContent) {
  // 1. Mandatory Fallback / Failure Structure
  const internalFallback = {
    overview: "Unable to analyze this code yet.",
    keyPoints: ["The engine could not process this file safely."],
    summary: "Try a simpler file or check formatting.",
    flow: [],
    diagram: "graph TD\n  A[Start] --> B[No Data available]",
    difficulty: "unknown",
    // Keep internal engine extensions for backward compatibility or extra UI features
    reasoning: "Analysis failed due to a structural error.",
    commonMistakes: ["Ignoring code formatting or syntax."],
    learningHints: ["Try analyzing a basic function first."]
  };

  if (!fileContent || fileContent.trim() === '') {
    return {
      ...internalFallback,
      overview: "No content provided for analysis.",
      keyPoints: ["Please select a non-empty file to begin analysis."],
      summary: "Input is empty."
    };
  }

  try {
    // 2. Full Pipeline Execution
    const parsedData = parseCode(fileContent);
    const analysis = analyzeCode(parsedData, fileContent);
    
    // If analysis fails (low signal), return the fallback
    if (!analysis) return internalFallback;

    const explanation = generateExplanation(analysis);
    const diagram = generateDiagram(analysis);

    // 3. Hard Validation mapping to Standardized Structure
    return {
      overview: explanation.overview || "Code overview available",
      keyPoints: Array.isArray(explanation.keyConcepts) ? explanation.keyConcepts : [],
      summary: explanation.summary || "Logic summary generated",
      flow: Array.isArray(explanation.breakdown) ? explanation.breakdown : [],
      diagram: diagram || "graph TD\n  A[Start] --> B[Diagram Error]",
      difficulty: explanation.difficultyLevel || "basic",
      // Pass-through for pedagogy features
      purpose: explanation.purpose || "",
      reasoning: explanation.reasoning || "",
      behaviorDetails: explanation.behaviorDetails || [],
      educationalExamples: explanation.concreteExamples || [],
      commonMistakes: explanation.commonMistakes || [],
      learningHints: explanation.learningHints || [],
      analogy: explanation.analogy || "",
      realWorldUsage: explanation.realWorldUsage || "",
      relationships: explanation.relationships || [],
      risks: explanation.risks || [],
      devInsight: explanation.devInsight || ""
    };
  } catch (error) {
    console.error("Analysis Engine Error:", error);
    return internalFallback;
  }
}
/**
 * 5. generateDiagram(analysis)
 * Visualizes the code execution flow as a Mermaid.js diagram.
 * 
 * @param {Object|null} analysis - Output from analyzeCode
 * @returns {string} Valid Mermaid.js diagram string
 */
/**
 * 5. generateDiagram(analysis)
 * Visualizes the code execution flow as a refined Mermaid.js diagram.
 * Focuses on clarity, action labels, and structural intelligence.
 * 
 * @param {Object|null} analysis - Output from analyzeCode
 * @returns {string} Valid Mermaid.js diagram string
 */
export function generateDiagram(analysis) {
  if (!analysis || !analysis.flow || analysis.flow.length === 0) {
    return "graph TD\n  A[Start] --> B[No data available]";
  }

  // 1. Structural Truncation
  let flowSteps = [...analysis.flow];
  const originalLength = flowSteps.length;
  if (originalLength > 6) {
    flowSteps = [
      ...flowSteps.slice(0, 4),
      "... intermediate steps ...",
      flowSteps[originalLength - 1]
    ];
  }

  let diagram = "graph TD\n";

  // 2. Refined Label Transformation
  const toActionLabel = (sentence) => {
    let clean = sentence
      // Remove prefixes first
      .replace(/Input stage:/i, "")
      .replace(/Transformation stage:/i, "")
      .replace(/Observability stage:/i, "")
      .replace(/Output stage:/i, "")
      .replace(/Static stage:/i, "")
      .replace(/Processing stage:/i, "")
      // Convert to verb-first actions
      .replace(/Function \w+ receives input (?:\w+ )?parameters?:?/i, "Receive")
      .replace(/Data enters (?:\w+ )?through (?:the )?parameters?:?/i, "Receive input")
      .replace(/The code uses \d+ variable\(s\) \((.*?)\) to store and modify information/i, "Store $1")
      .replace(/is combined with/i, "Combine with")
      .replace(/is calculated/i, "Calculate")
      .replace(/is returned/i, "Return")
      .replace(/Final result \((.*?)\) is returned/i, "Return $1")
      .trim();
    
    // Step 2.5: Strip redundant role words from the start of the label
    clean = clean
      .replace(/^(?:Input|Output|Return|Result|Process|Initialize)\s+:?/i, "")
      .trim();

    // Capitalize first letter
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  flowSteps.forEach((step, index) => {
    // Architectural Change: Numeric IDs (node0, node1...) to prevent collisions in large flows
    const id = `node${index}`;
    const nextId = `node${index + 1}`;

    // 3. Precise Role Detection (Before transformation)
    const lowerStep = step.toLowerCase();
    let role = "Process";
    if (lowerStep.includes("input") || lowerStep.includes("receive") || lowerStep.includes("enter") || lowerStep.includes("parameter")) role = "Input";
    else if (lowerStep.includes("output") || lowerStep.includes("return") || lowerStep.includes("result")) role = "Output";

    const isCondition = lowerStep.includes("if") || lowerStep.includes("condition") || lowerStep.includes("check");
    const shape = isCondition ? ["{", "}"] : ["[", "]"];

    // 4. Generate Action Label
    const actionLabel = toActionLabel(step);
    
    // Final sanitization for Mermaid safety (Escaping reserved terms/chars)
    const cleanLabel = actionLabel
      .replace(/[\[\]{}()]/g, "") // Remove brackets
      .replace(/[;]/g, ",")       // Remove semicolons
      .replace(/-->/g, "->")      // Sanitize connections
      .replace(/["']/g, "'")      // Unify quotes
      .trim();

    // Word count control
    const words = cleanLabel.split(" ");
    const displayLabel = words.length > 7 ? words.slice(0, 6).join(" ") + "..." : cleanLabel;

    diagram += `  ${id}${shape[0]}${role}: ${displayLabel}${shape[1]}\n`;

    // 5. Connect next node
    if (index < flowSteps.length - 1) {
      const connection = isCondition ? " -->|Yes| " : " --> ";
      diagram += `  ${id}${connection}${nextId}\n`;
    }
  });

  return diagram;
}

/**
 * 6. analyzeError(errorMessage, codeContext)
 * A context-aware mentor-style error intelligence engine.
 * 
 * @param {string} errorMessage - The raw error message
 * @param {string} codeContext - Optional code snippet where error occurred
 * @returns {Object} Structured error intelligence
 */
export function analyzeError(errorMessage, codeContext = "") {
  // 1. Helper: Extract Variable and Method from Error
  const extractErrorParts = (msg) => {
    let variable = "the item";
    let method = null;

    // Pattern: x.map is not a function
    const funcMatch = msg.match(/(?:\w+Error:\s*)?([\w$.]+)\.(\w+)\s+is not a function/i);
    if (funcMatch) {
      return { variable: funcMatch[1], method: funcMatch[2] };
    }

    // Pattern: x is not a function
    const simpleFuncMatch = msg.match(/(?:\w+Error:\s*)?([\w$.]+)\s+is not a function/i);
    if (simpleFuncMatch) {
      return { variable: simpleFuncMatch[1], method: null };
    }

    // Pattern: x is not defined
    const refMatch = msg.match(/(?:\w+Error:\s*)?([\w$.]+)\s+is not defined/i);
    if (refMatch) {
      return { variable: refMatch[1], method: null };
    }

    // Pattern: cannot read properties of undefined (reading 'x')
    const propMatch = msg.match(/reading\s+'(\w+)'/i);
    if (propMatch) {
      return { variable: "the object", method: propMatch[1] };
    }

    return { variable, method };
  };

  // 2. Helper: Infer Type from Context
  const inferTypeFromContext = (varName, context) => {
    if (!context || varName === "the item" || varName === "the object") return { type: "unknown", value: null };

    // Escape varName for regex
    const escapedVar = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const declPattern = new RegExp(`(?:const|let|var)\\s+${escapedVar}\\s*=\\s*([^;\\n]+)`, 'i');
    const match = context.match(declPattern);

    if (match) {
      const val = match[1].trim();
      if (val.startsWith('[') || val.includes('Array')) return { type: "array", value: val };
      if (val.startsWith('{') || val.includes('Object')) return { type: "object", value: val };
      if (val.match(/^["'`]/)) return { type: "string", value: val };
      if (val.match(/^\d+$/)) return { type: "number", value: val };
      if (val === "null") return { type: "null", value: "null" };
      if (val === "undefined") return { type: "undefined", value: "undefined" };
    }

    return { type: "unknown", value: null };
  };

  // 3. Core Logic
  const { variable, method } = extractErrorParts(errorMessage);
  const { type, value } = inferTypeFromContext(variable, codeContext);

  const fallback = {
    meaning: "This error indicates something went wrong during execution.",
    causes: ["The system cannot determine the exact cause from the message"],
    fix: ["Check your code step by step", "Look for syntax or logic mistakes"],
    concept: "General debugging",
    commonMistake: "Ignoring error details or skipping debugging steps",
    learningHint: "Read the error message carefully and identify key terms",
    confidenceLevel: "low",
    category: "Unknown",
    example: "",
    errorParts: { variable, method },
    severity: "blocking",
    warning: ""
  };

  if (!errorMessage) return fallback;

  // 4. Pattern Definitions
  const patterns = [
    {
      id: "type_not_function",
      regex: /is not a function/i,
      category: "TypeError",
      meaning: "You're trying to call something as a function, but it's a different data type.",
      concept: "Type Mismatch",
      commonMistake: "Using the wrong method for the variable's data type.",
      learningHint: "Check if the variable is what you think it is using console.log()",
      example: "const x = 5; x() // TypeError",
      confidence: "high"
    },
    {
      id: "ref_not_defined",
      regex: /is not defined/i,
      category: "ReferenceError",
      meaning: "The computer doesn't recognize this variable name.",
      concept: "Variable Scope",
      commonMistake: "Typing the name wrong or forgetting to declare it with 'const' or 'let'.",
      learningHint: "Verify the spelling and where you declared the variable.",
      example: "console.log(missingVar) // ReferenceError",
      confidence: "high"
    },
    {
      id: "type_null_undef",
      regex: /cannot read properties of (null|undefined)/i,
      category: "TypeError",
      meaning: "You're trying to access data from a variable that is empty or hasn't been set.",
      concept: "Null/Undefined Safety",
      commonMistake: "Assuming a variable has data before it's actually loaded.",
      learningHint: "Use 'if (variable)' to check if it exists before using it.",
      example: "let x; console.log(x.name) // TypeError",
      confidence: "high"
    }
  ];

  // 5. Context-Aware Refinement
  for (const p of patterns) {
    if (errorMessage.match(p.regex)) {
      let causes = [`"${variable}" might not be initialized properly.`];
      let fixes = [
        `Check the value of "${variable}" using console.log(${variable})`,
        `Confirm that "${variable}" is initialized before this point in your code.`,
        `Initialize it properly, for example: const ${variable} = ...`
      ];
      let warning = "";
      let severity = "blocking";
      let summary = "";

      // Precise Diagnosis Logic
      if (type !== "unknown") {
        if (type === "number" && method === "map") {
          causes = [`"${variable}" is a Number (${value}), but .map() only works on Arrays.`];
          fixes = [
            `Check "${variable}" using console.log(${variable}) to see its current value.`,
            `Confirm that you intended to treat "${variable}" as an Array.`,
            `If it's a single value, wrap it first: [${variable}].map(...)`
          ];
          warning = `Astra detected that you're treating the number ${value} like a list of items.`;
          summary = `In short: you're using an array method (.map) on a non-array value.`;
        } else if (type === "undefined") {
          causes = [`"${variable}" was declared but never given a value (it's currently undefined).`];
          fixes = [
            `Log "${variable}" to confirm it is indeed undefined.`,
            `Confirm where "${variable}" should have received its data.`,
            `Assign a value during declaration: let ${variable} = [];`
          ];
          warning = "Using undefined variables is a very common cause of crashes in JS.";
          summary = `In short: you're accessing data from a variable that doesn't exist yet.`;
        } else {
          causes.push(`"${variable}" is detected as ${type}.`);
        }
      }

      // Personalized Meaning & Tone
      let tonePrefix = "Astra Mentor: ";
      if (p.category === "ReferenceError") {
        tonePrefix = "URGENT: Direct crash detected. ";
        summary = summary || `In short: you're using a name "${variable}" that hasn't been defined.`;
      } else if (p.category === "TypeError") {
        tonePrefix = "Heads up: Logic instability. ";
        summary = summary || `In short: you're performing an operation on the wrong type of data.`;
      }

      const personalizedMeaning = `${tonePrefix}${p.meaning} ${summary}`.trim();

      // Personalized Example
      const personalizedExample = p.example.replace(/x/g, variable).replace(/missingVar/g, variable);

      return {
        ...p,
        meaning: personalizedMeaning,
        causes,
        fix: fixes,
        confidenceLevel: type !== "unknown" ? "high" : p.confidence,
        category: p.category,
        errorParts: { variable, method },
        severity: severity,
        warning: warning || `Ensure "${variable}" matches the expected structure.`,
        example: personalizedExample
      };
    }
  }

  // 6. Generic Category Fallback
  if (errorMessage.includes("SyntaxError")) return { ...fallback, category: "SyntaxError", meaning: "A typo in your code structure is preventing it from running." };

  return fallback;
}
