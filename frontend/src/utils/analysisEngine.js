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
 * Generates semantic meaning and intent from parsed metadata.
 * 
 * @param {Object} parsedData - Metadata from parseCode
 * @returns {Object} Semantic analysis results
 */
export function analyzeCode(parsedData) {
  const { functions, variables, logs, returns } = parsedData;

  const analysis = {
    functionInsights: functions.map(f => {
      const paramDesc = f.parameters.length > 0 
        ? `accepting arguments (${f.parameters.join(', ')})` 
        : 'taking no arguments';
      return `Entry point '${f.name}' is established, ${paramDesc}.`;
    }),
    logicFlow: "",
    dataImpact: "",
    debugContext: ""
  };

  // Build flow description
  if (functions.length > 0) {
    analysis.logicFlow = `The execution flow is primarily driven by ${functions.length} functional block(s). Starting from ${functions[0].name}, the logic processes inputs through defined procedures.`;
  } else {
    analysis.logicFlow = "The code consists of a sequential execution script without explicit top-level function encapsulations.";
  }

  // Build data impact
  if (variables.length > 0 || returns.length > 0) {
    const varSummary = variables.length > 0 ? `manages state through ${variables.length} identifiers (${variables.slice(0, 3).join(', ')}${variables.length > 3 ? '...' : ''})` : 'operates with direct values';
    const retSummary = returns.length > 0 ? `ultimately yielding ${returns.length} distinct result(s)` : 'executing as a void operation';
    analysis.dataImpact = `This module ${varSummary} and is designed to produce output, ${retSummary}.`;
  } else {
    analysis.dataImpact = "The module appears to be a declarative or static configuration file with minimal dynamic data processing.";
  }

  // Build debug context
  if (logs.length > 0) {
    analysis.debugContext = `Operational transparency is maintained via ${logs.length} telemetry points (console logs), monitoring values like ${logs[0]}.`;
  } else {
    analysis.debugContext = "There are no active logging statements, indicating a production-optimized or silent execution script.";
  }

  return analysis;
}

/**
 * 3. generateExplanation(analysis)
 * Formats analysis into the final structured explanation object.
 * 
 * @param {Object} analysis - Output from analyzeCode
 * @returns {Object} UI-ready explanation
 */
export function generateExplanation(analysis) {
  return {
    overview: `Technical analysis reveals a structured implementation focused on functional modularity. ${analysis.logicFlow}`,
    keyPoints: [
      ...analysis.functionInsights,
      analysis.dataImpact,
      analysis.debugContext
    ],
    summary: `This code defines a set of procedures to process data and manage state, ensuring ${analysis.functionInsights.length > 0 ? 'the logic is reusable' : 'the script completes its sequence'} efficiently.`
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
