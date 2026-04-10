import { explainLine } from './frontend/src/utils/analysisEngine.js';

console.log("--- EXECUTION ENGINE TEST 1: return a + b ---");
const mathCode = "return a + b;";
const mathResult = explainLine(mathCode);
console.log("Steps:", mathResult.steps);
const mathOk = 
    mathResult.steps.some(s => s.includes("a = 2")) && 
    mathResult.steps.some(s => s.includes("2 + 3 = 5")) &&
    mathResult.steps.some(s => s.includes("return 5"));
console.log("Math Check:", mathOk ? "PASS" : "FAIL");

console.log("\n--- EXECUTION ENGINE TEST 2: console.log(name) ---");
const logCode = "console.log(name);";
const logResult = explainLine(logCode);
console.log("Steps:", logResult.steps);
const logOk = 
    logResult.steps.some(s => s.includes("name = 'Alex'")) && 
    logResult.steps.some(s => s.includes("Function call detected"));
console.log("Log Check:", logOk ? "PASS" : "FAIL");

console.log("\n--- EXECUTION ENGINE TEST 3: String Coercion ---");
const coercionCode = "return name + count;";
const coercionResult = explainLine(coercionCode);
console.log("Steps:", coercionResult.steps);
const coerceOk = coercionResult.steps.some(s => s.includes('"Alex2"'));
console.log("Coercion Check:", coerceOk ? "PASS" : "FAIL");

console.log("\n--- FINAL STATUS ---");
if (mathOk && logOk && coerceOk) {
    console.log("EXECUTION ENGINE REFINED: ✅");
} else {
    console.log("EXECUTION ENGINE INCOMPLETE: ❌");
}
