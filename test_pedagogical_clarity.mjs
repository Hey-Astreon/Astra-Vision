import { explainCode } from './frontend/src/utils/analysisEngine.js';

console.log("--- PEDAGOGY TEST 1: The Combiner (+) ---");
const hybridCode = "function combine(a, b) { return a + b; }";
const hybridResult = explainCode(hybridCode);
console.log("Overview:", hybridResult.overview);
console.log("Analogy:", hybridResult.analogy);
console.log("Behavior Details:", hybridResult.behaviorDetails.join(" "));
console.log("Examples:", hybridResult.educationalExamples);
const isPrecise = 
    hybridResult.overview.includes("combining") && 
    hybridResult.analogy.includes("Combiner") &&
    hybridResult.educationalExamples.length >= 2;
console.log("Precision Check:", isPrecise ? "PASS" : "FAIL");

console.log("\n--- PEDAGOGY TEST 2: Softened Architecture ---");
const pureCode = "function add(a, b) { return a + b; }";
const pureResult = explainCode(pureCode);
console.log("Reasoning:", pureResult.reasoning);
console.log("Dev Insight:", pureResult.devInsight);
const isHumble = 
    pureResult.reasoning.includes("it appears to be") && 
    pureResult.devInsight.includes("appears to be");
console.log("Humble Tone Check:", isHumble ? "PASS" : "FAIL");

console.log("\n--- PEDAGOGY TEST 3: Practical Risks ---");
console.log("Risks:", hybridResult.risks);
const isPractical = hybridResult.risks.some(r => r.includes('"5" and 5'));
console.log("Practical Risk Check:", isPractical ? "PASS" : "FAIL");

console.log("\n--- FINAL PEDAGOGY STATUS ---");
if (isPrecise && isHumble && isPractical) {
    console.log("CLARITY UPGRADE VERIFIED: ✅");
} else {
    console.log("CLARITY UPGRADE INCOMPLETE: ❌");
}
