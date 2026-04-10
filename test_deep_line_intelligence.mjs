import { explainLine } from './frontend/src/utils/analysisEngine.js';

console.log("--- DEEP INTELLIGENCE TEST 1: function calculateTotal() ---");
const funcCode = "export function calculateTotal(price, tax) {";
const funcResult = explainLine(funcCode);
console.log("Meaning:", funcResult.meaning);
console.log("Why:", funcResult.why);
console.log("Example:", funcResult.example);
const isFuncDeep = 
    funcResult.why.includes("avoid repeating") && 
    funcResult.example.includes("calculateTotal(...)");
console.log("Deep Function Check:", isFuncDeep ? "PASS" : "FAIL");

console.log("\n--- DEEP INTELLIGENCE TEST 2: return result ---");
const retCode = "return result;";
const retResult = explainLine(retCode);
console.log("Why:", retResult.why);
const isRetDeep = retResult.why.includes("usable result");
console.log("Deep Return Check:", isRetDeep ? "PASS" : "FAIL");

console.log("\n--- DEEP INTELLIGENCE TEST 3: Mathematical Scaling ---");
const mathCode = "const scaled = base * 2;";
const mathResult = explainLine(mathCode);
console.log("Why:", mathResult.why);
console.log("Example:", mathResult.example);
const isMathDeep = 
    mathResult.why.includes("mathematical transformations") && 
    mathResult.example === "10 * 2 = 20";
console.log("Deep Math Check:", isMathDeep ? "PASS" : "FAIL");

console.log("\n--- FINAL PEDAGOGICAL STATUS ---");
if (isFuncDeep && isRetDeep && isMathDeep) {
    console.log("DEEP LINE INTELLIGENCE VERIFIED: ✅");
} else {
    console.log("DEEP LINE INTELLIGENCE INCOMPLETE: ❌");
}
