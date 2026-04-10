import { explainCode } from './frontend/src/utils/analysisEngine.js';

console.log("--- ANALOGY ACCURACY TEST 1: Ambiguous Addition (+) ---");
const plusCode = "function sum(a, b) { return a + b; }";
const plusResult = explainCode(plusCode);
console.log("Analogy:", plusResult.analogy);
const isPlusSafe = 
    plusResult.analogy.includes("Value Combiner") && 
    !plusResult.analogy.includes("calculator") &&
    plusResult.analogy.includes("input types");
console.log("Accuracy (+) Check:", isPlusSafe ? "PASS" : "FAIL");

console.log("\n--- ANALOGY ACCURACY TEST 2: Pure Math (Non-Plus) ---");
const pureMathCode = "function multiply(a, b) { return a * b; }";
const pureMathResult = explainCode(pureMathCode);
console.log("Analogy:", pureMathResult.analogy);
const isPureMathSafe = pureMathResult.analogy.includes("calculator");
console.log("Accuracy (*) Check:", isPureMathSafe ? "PASS" : "FAIL");

console.log("\n--- ANALOGY ACCURACY TEST 3: String Builder ---");
const stringCode = "function greet(name) { return 'Hello ' + name; }";
const stringResult = explainCode(stringCode);
console.log("Analogy:", stringResult.analogy);
const isStringSafe = stringResult.analogy.includes("label maker");
console.log("Accuracy (String) Check:", isStringSafe ? "PASS" : "FAIL");

console.log("\n--- ANALOGY ACCURACY TEST 4: Low Confidence Safety ---");
const fuzzyCode = "function doSomething(x) { return x.val; }";
const fuzzyResult = explainCode(fuzzyCode);
console.log("Analogy:", fuzzyResult.analogy);
const isFuzzySafe = fuzzyResult.analogy === "" || fuzzyResult.analogy === null;
console.log("Fuzzy Confidence Safety Check:", isFuzzySafe ? "PASS" : "FAIL");

console.log("\n--- FINAL ANALOGY STATUS ---");
if (isPlusSafe && isPureMathSafe && isStringSafe && isFuzzySafe) {
    console.log("ANALOGY ENGINE 100% ACCURATE: ✅");
} else {
    console.log("ANALOGY ENGINE MISLEADING: ❌");
}
