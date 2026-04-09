import { generateDiagram } from './frontend/src/utils/analysisEngine.js';

const basicFlow = {
  flow: [
    "Input stage: Data enters through the parameters: name",
    "Transformation stage: Input is combined with string 'Hello'",
    "Output stage: Final result is returned"
  ]
};

const longFlow = {
  flow: [
    "Step 1",
    "Step 2",
    "Step 3",
    "Step 4",
    "Step 5",
    "Step 6",
    "Step 7: Final result"
  ]
};

const conditionalFlow = {
  flow: [
    "Receive input x",
    "If x is positive then proceed",
    "Output result"
  ]
};

console.log("--- TEST: Basic Flow (Label Shortening) ---");
const d1 = generateDiagram(basicFlow);
console.log(d1);

console.log("\n--- TEST: Long Flow (Truncation) ---");
const d2 = generateDiagram(longFlow);
console.log(d2);

console.log("\n--- TEST: Conditional Flow (Branching) ---");
const d3 = generateDiagram(conditionalFlow);
console.log(d3);
