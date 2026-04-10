import { explainLine } from './frontend/src/utils/analysisEngine.js';

console.log("--- SMART ENGINE TEST 1: export function sum(a, b) ---");
const multiCode = "export function sum(a, b)";
const multiResult = explainLine(multiCode);
console.log("Meaning:", multiResult.meaning);
console.log("Impact:", multiResult.impact);
const isComposed = 
    multiResult.meaning.includes("available outside") && 
    multiResult.meaning.includes("block of logic");
console.log("Composed Check:", isComposed ? "PASS" : "FAIL");

console.log("\n--- SMART ENGINE TEST 2: return x + y ---");
const retPlusCode = "return x + y;";
const retPlusResult = explainLine(retPlusCode);
console.log("Meaning:", retPlusResult.meaning);
console.log("Warning:", retPlusResult.warning);
const isRetPlusCorrect = 
    retPlusResult.meaning.includes("back from the function") && 
    retPlusResult.meaning.includes("Combines values");
console.log("Return + Operator Check:", isRetPlusCorrect ? "PASS" : "FAIL");

console.log("\n--- SMART ENGINE TEST 3: Fallback Safety ---");
const fallbackCode = "someComplexLogic();";
const fallbackResult = explainLine(fallbackCode);
console.log("Meaning:", fallbackResult.meaning);
const isFallbackSafe = fallbackResult.meaning === "Performs a step in the program execution.";
console.log("Fallback Check:", isFallbackSafe ? "PASS" : "FAIL");

console.log("\n--- FINAL STATUS ---");
if (isComposed && isRetPlusCorrect && isFallbackSafe) {
    console.log("SMART LINE ENGINE VERIFIED: ✅");
} else {
    console.log("SMART LINE ENGINE INCOMPLETE: ❌");
}
