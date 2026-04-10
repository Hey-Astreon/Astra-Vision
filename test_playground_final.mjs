import { explainLine, parseInputValue, simulateExecution } from './frontend/src/utils/analysisEngine.js';

console.log("--- FINAL PLAYGROUND TEST 1: parseInputValue ---");
const p1 = parseInputValue("10");
console.log("Input: 10 ->", p1.type);
const p2 = parseInputValue("'Alex'");
console.log("Input: 'Alex' ->", p2.type);
const p3 = parseInputValue("Alex");
console.log("Input: Alex ->", p3.type);
const parseOk = p1.type === "Number" && p2.type === "String" && p3.type === "Invalid";
console.log("Parse Check:", parseOk ? "PASS" : "FAIL");

console.log("\n--- FINAL PLAYGROUND TEST 2: Math Execution ---");
const mathLine = "return a + b;";
const simMath = simulateExecution(mathLine, { a: "10", b: "20" });
console.log("Result:", simMath.result, `(${simMath.resultType})`);
console.log("Feedback:", simMath.feedback);
const mathOk = simMath.result === 30 && simMath.resultType === "Number" && simMath.status === "success";
console.log("Math Exec Check:", mathOk ? "PASS" : "FAIL");

console.log("\n--- FINAL PLAYGROUND TEST 3: Coercion Execution ---");
const coerceLine = "return a + b;";
const simCoerce = simulateExecution(coerceLine, { a: "'10'", b: "20" });
console.log("Result:", simCoerce.result, `(${simCoerce.resultType})`);
console.log("Feedback:", simCoerce.feedback);
const coerceOk = simCoerce.result === '"1020"' && simCoerce.resultType === "String" && simCoerce.status === "warning";
console.log("Coercion Exec Check:", coerceOk ? "PASS" : "FAIL");

console.log("\n--- FINAL STATUS ---");
if (parseOk && mathOk && coerceOk) {
    console.log("PHASE 8 FINAL FORM VERIFIED: ✅");
} else {
    console.log("PHASE 8 FINAL FORM INCOMPLETE: ❌");
}
