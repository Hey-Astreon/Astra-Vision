import { explainCode } from './frontend/src/utils/analysisEngine.js';

console.log("--- DEEP ANALYSIS TEST 1: Math Coercion ---");
const mathCode = "function sum(a, b) { return a + b; }";
const mathResult = explainCode(mathCode);
console.log("Overview:", mathResult.overview);
console.log("Risks:", mathResult.risks);
console.log("Insight:", mathResult.devInsight);
const hasMathRisk = mathResult.risks.some(r => r.includes("Type Coercion"));
console.log("Math Risk Detection:", hasMathRisk ? "PASS" : "FAIL");

console.log("\n--- DEEP ANALYSIS TEST 2: Async & Side-Effects ---");
const asyncCode = "async function fetchData(url) { const r = await fetch(url); return r.json(); }";
const asyncResult = explainCode(asyncCode);
console.log("Overview:", asyncResult.overview);
console.log("Risks:", asyncResult.risks);
console.log("Pattern:", asyncResult.reasoning);
const hasAsyncBehavior = asyncResult.overview.includes("service");
console.log("Async Behavior Detection:", hasAsyncBehavior ? "PASS" : "FAIL");

console.log("\n--- DEEP ANALYSIS TEST 3: Null Safety ---");
const nullCode = "function getProp(obj) { return obj.name; }";
const nullResult = explainCode(nullCode);
console.log("Risks:", nullResult.risks);
const hasNullRisk = nullResult.risks.some(r => r.includes("Null Safety"));
console.log("Null Risk Detection:", hasNullRisk ? "PASS" : "FAIL");

console.log("\n--- DEEP ANALYSIS FINAL STATUS ---");
if (hasMathRisk && hasAsyncBehavior && hasNullRisk) {
    console.log("TEACHING ENGINE UPGRADED: ✅");
} else {
    console.log("TEACHING ENGINE PARTIAL: ❌");
}
