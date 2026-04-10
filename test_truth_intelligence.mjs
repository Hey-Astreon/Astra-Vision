import { explainCode } from './frontend/src/utils/analysisEngine.js';

console.log("--- TRUTH TEST 1: Generic Logic (Zero Assumption) ---");
const genericCode = "function greet(name) { return 'Hello ' + name; }";
const genericResult = explainCode(genericCode);
console.log("Purpose:", genericResult.purpose);
console.log("Analogy:", genericResult.analogy);
console.log("Real World Case:", genericResult.realWorldUsage);
const isTruthful = 
    genericResult.analogy.includes("label maker") && 
    (genericResult.realWorldUsage === null || genericResult.realWorldUsage === "");
console.log("Generic Truthfulness:", isTruthful ? "PASS" : "FAIL");

console.log("\n--- TRUTH TEST 2: High Confidence Math ---");
const mathCode = "function calculateTotal(price, tax) { return price + (price * tax); }";
const mathResult = explainCode(mathCode);
console.log("Purpose:", mathResult.purpose);
console.log("Analogy:", mathResult.analogy);
const isMathTruthful = 
    mathResult.purpose.includes("Business Logic") && 
    mathResult.analogy.includes("calculator");
console.log("Math Truthfulness:", isMathTruthful ? "PASS" : "FAIL");

console.log("\n--- TRUTH TEST 3: No Side Effects (Pure Pattern) ---");
const pureCode = "function add(a, b) { return a + b; }";
const pureResult = explainCode(pureCode);
console.log("Architect's Reasoning:", pureResult.reasoning);
const isPureTruthful = pureResult.reasoning.includes("Stateless Utility");
console.log("Pure Pattern Detection:", isPureTruthful ? "PASS" : "FAIL");

console.log("\n--- FINAL TRUTH STATUS ---");
if (isTruthful && isMathTruthful && isPureTruthful) {
    console.log("INTELLIGENCE ENGINE TRUTHFUL: ✅");
} else {
    console.log("INTELLIGENCE ENGINE HALLUCINATING: ❌");
}
