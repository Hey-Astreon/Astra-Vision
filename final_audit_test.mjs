import { parseCode, generateDiagram, analyzeCode, analyzeError } from './frontend/src/utils/analysisEngine.js';

console.log("--- AUDIT TEST 1: Object Destructuring ---");
const code = "const { name, age } = user; function test(x) { return x; }";
const parsed = parseCode(code);
console.log("Variables detected:", parsed.variables);
const hasDestructured = parsed.variables.includes("name") && parsed.variables.includes("age");
console.log("Destructuring Support:", hasDestructured ? "PASS" : "FAIL");

console.log("\n--- AUDIT TEST 2: Numeric IDs & Mermaid Safety ---");
const analysis = analyzeCode(parsed);
const diagram = generateDiagram(analysis);
console.log("Diagram Output Sample:\n", diagram.split('\n').slice(0, 5).join('\n'));
const hasNumericIds = diagram.includes("node0") && diagram.includes("node1");
console.log("Numeric IDs Support:", hasNumericIds ? "PASS" : "FAIL");

console.log("\n--- AUDIT TEST 3: Error Engine Integration (Context-Aware) ---");
const errorMsg = "ReferenceError: name is not defined";
const errorContext = "const { age } = user; console.log(name);";
const errorResult = analyzeError(errorMsg, errorContext);
console.log("Error Meaning:", errorResult.meaning);
console.log("Error Parts:", errorResult.errorParts);
const hasContext = errorResult.meaning.includes("name");
console.log("Error Context Integration:", hasContext ? "PASS" : "FAIL");

console.log("\n--- FINAL AUDIT STATUS ---");
if (hasDestructured && hasNumericIds && hasContext) {
    console.log("SYSTEM STABLE: ✅");
} else {
    console.log("SYSTEM UNSTABLE: ❌");
}
