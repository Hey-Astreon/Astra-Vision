import { explainLine } from './frontend/src/utils/analysisEngine.js';

console.log("--- DYNAMIC INTELLIGENCE TEST 1: return identifier ---");
const retCode = "return totalCost;";
const retResult = explainLine(retCode);
console.log("Priority:", retResult.priority);
const isRetHigh = retResult.priority === "high";
console.log("Priority Check:", isRetHigh ? "PASS" : "FAIL");

console.log("\n--- DYNAMIC INTELLIGENCE TEST 2: function multiply(a, b) ---");
const funcCode = "export function multiply(a, b) {";
const funcResult = explainLine(funcCode);
console.log("Example:", funcResult.example);
const isFuncSmart = funcResult.example.includes("multiply(2, 3)");
console.log("Smart Naming Check:", isFuncSmart ? "PASS" : "FAIL");

console.log("\n--- DYNAMIC INTELLIGENCE TEST 3: Smart Dual + Example ---");
const plusCode = "const msg = 'User: ' + userName;";
const plusResult = explainLine(plusCode);
console.log("Example:", plusResult.example);
const isPlusDual = plusResult.example.includes("(Math)") && plusResult.example.includes("(Joining)");
console.log("Dual Example Check:", isPlusDual ? "PASS" : "FAIL");

console.log("\n--- DYNAMIC INTELLIGENCE TEST 4: Math Coercion Example ---");
const multCode = "const result = a * b;";
const multResult = explainLine(multCode);
console.log("Example:", multResult.example);
const isMultCoerce = multResult.example.includes("JS converts text to number");
console.log("Coercion Check:", isMultCoerce ? "PASS" : "FAIL");

console.log("\n--- FINAL DYNAMIC ENGINE STATUS ---");
if (isRetHigh && isFuncSmart && isPlusDual && isMultCoerce) {
    console.log("DYNAMIC ENGINE VERIFIED: ✅");
} else {
    console.log("DYNAMIC ENGINE INCOMPLETE: ❌");
}
