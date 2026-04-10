import { analyzeLine } from './frontend/src/utils/analysisEngine.js';

console.log("--- LINE ANALYSIS TEST 1: Variable Declaration ---");
const varCode = "const total = 500;";
const varResult = analyzeLine(varCode);
console.log("Output:", varResult);
const isVarCorrect = varResult.explanation.includes("container named 'total'");
console.log("Check:", isVarCorrect ? "PASS" : "FAIL");

console.log("\n--- LINE ANALYSIS TEST 2: Addition Operator ---");
const plusCode = "return a + b;";
const plusResult = analyzeLine(plusCode);
console.log("Output:", plusResult);
const isPlusCorrect = plusResult.explanation.includes("addition or text joining") && plusResult.example !== null;
console.log("Check:", isPlusCorrect ? "PASS" : "FAIL");

console.log("\n--- LINE ANALYSIS TEST 3: Property Access Safety ---");
const propCode = "const name = user.profile.name;";
const propResult = analyzeLine(propCode);
console.log("Safety Note:", propResult.mistake);
const isPropCorrect = propResult.mistake.includes("null or undefined");
console.log("Check:", isPropCorrect ? "PASS" : "FAIL");

console.log("\n--- LINE ANALYSIS TEST 4: Return Statement ---");
const retCode = "return result;";
const retResult = analyzeLine(retCode);
console.log("Output:", retResult);
const isRetCorrect = retResult.explanation.includes("Sends a value back");
console.log("Check:", isRetCorrect ? "PASS" : "FAIL");

console.log("\n--- FINAL LINE ENGINE STATUS ---");
if (isVarCorrect && isPlusCorrect && isPropCorrect && isRetCorrect) {
    console.log("LINE ANALYSIS ENGINE VERIFIED: ✅");
} else {
    console.log("LINE ANALYSIS ENGINE INCOMPLETE: ❌");
}
