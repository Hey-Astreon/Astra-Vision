import { explainLine } from './frontend/src/utils/analysisEngine.js';

console.log("--- PHASE 6 ALIGNMENT TEST: Function Detection ---");
const funcCode = "function sum(a, b) {";
const funcResult = explainLine(funcCode);
console.log("Meaning:", funcResult.meaning);
const isFuncCorrect = funcResult.meaning.includes("reusable block");
console.log("Check:", isFuncCorrect ? "PASS" : "FAIL");

console.log("\n--- PHASE 6 ALIGNMENT TEST: Return Detection ---");
const retCode = "return total;";
const retResult = explainLine(retCode);
console.log("Meaning:", retResult.meaning);
const isRetCorrect = retResult.meaning.includes("Sends a value back");
console.log("Check:", isRetCorrect ? "PASS" : "FAIL");

console.log("\n--- PHASE 6 ALIGNMENT TEST: Operator Bonus ---");
const plusCode = "const x = a + b;";
const plusResult = explainLine(plusCode);
console.log("Example:", plusResult.example);
const isPlusCorrect = plusResult.example !== null;
console.log("Check:", isPlusCorrect ? "PASS" : "FAIL");

console.log("\n--- FINAL PHASE 6 STATUS ---");
if (isFuncCorrect && isRetCorrect && isPlusCorrect) {
    console.log("PHASE 6 ALIGNED: ✅");
} else {
    console.log("PHASE 6 MISALIGNED: ❌");
}
