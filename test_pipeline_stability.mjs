import { explainCode } from './frontend/src/utils/analysisEngine.js';

const testCases = [
  { name: "Empty Input", code: "" },
  { name: "Simple Valid JS", code: "function test() { return 1; }" },
  { name: "Complex/Invalid JS (Simulation)", code: "const x = { " }
];

testCases.forEach(tc => {
  console.log(`--- TEST: ${tc.name} ---`);
  const result = explainCode(tc.code);
  
  const requiredKeys = ['overview', 'keyPoints', 'summary', 'flow', 'diagram', 'difficulty'];
  const missing = requiredKeys.filter(k => !(k in result));
  const isArray = Array.isArray(result.keyPoints) && Array.isArray(result.flow);
  
  console.log(`Structure Valid: ${missing.length === 0}`);
  if (missing.length > 0) console.log(`Missing keys: ${missing.join(', ')}`);
  console.log(`Arrays Valid: ${isArray}`);
  console.log("Summary Output:", result.summary);
  console.log("\n");
});
