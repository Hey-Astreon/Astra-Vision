import { explainLine } from './frontend/src/utils/analysisEngine.js';

const mockContextLine = "export function sum(a, b) {";
const mockSelectedLine = "  return a + b;";

console.log("--- TEST 1: sum(a, b) context ---");
const analysis = explainLine(mockSelectedLine, { a: "10", b: "20" }, { contextLine: mockContextLine });

console.log("Analysis Result:");
console.log("- Detected Variables:", analysis.detectedVariables);
console.log("- Steps:", analysis.steps);
console.log("- Result:", analysis.result);
console.log("- Result Type:", analysis.resultType);

if (analysis.detectedVariables.includes('sum')) {
    console.error("FAIL: 'sum' should not be detected as a variable.");
} else {
    console.log("PASS: 'sum' successfully excluded.");
}

if (analysis.result == 30) {
    console.log("PASS: Result correctly calculated as 30.");
} else {
    console.error("FAIL: Result should be 30, got", analysis.result);
}

console.log("\n--- TEST 2: Assignment context ---");
const mockAssignLine = "  const total = a * b;";
const analysis2 = explainLine(mockAssignLine, { a: "5", b: "6" }, { contextLine: mockContextLine });

console.log("- Detected Variables:", analysis2.detectedVariables);
console.log("- Steps:", analysis2.steps);
console.log("- Result:", analysis2.result);

if (analysis2.result == 30) {
    console.log("PASS: Result correctly calculated as 30.");
} else {
    console.error("FAIL: Result should be 30, got", analysis2.result);
}
