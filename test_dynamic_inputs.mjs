import { explainLine, parseInputValue, simulateExecution } from './frontend/src/utils/analysisEngine.js';

console.log("--- DYNAMIC UI ENGINE TEST: detectedVariables ---");
const mathLine = "return price + tax;";
const simResult = simulateExecution(mathLine);
console.log("Detected Variables:", simResult.detectedVariables);

const mathOk = 
    simResult.detectedVariables.includes("price") && 
    simResult.detectedVariables.includes("tax") &&
    simResult.detectedVariables.length === 2;

console.log("Dynamic Key Check:", mathOk ? "PASS" : "FAIL");

console.log("\n--- SIMULATION INPUTS TEST ---");
const simOverride = simulateExecution(mathLine, { price: "100", tax: "20" });
console.log("Result with Inputs:", simOverride.result, `(${simOverride.resultType})`);
const overrideOk = simOverride.result === 120 && simOverride.resultType === "Number";
console.log("Override Check:", overrideOk ? "PASS" : "FAIL");

console.log("\n--- FINAL STATUS ---");
if (mathOk && overrideOk) {
    console.log("DYNAMIC SIMULATION UI ENGINE: ✅");
} else {
    console.log("DYNAMIC SIMULATION UI ENGINE: ❌");
}
