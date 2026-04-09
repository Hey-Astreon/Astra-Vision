import { analyzeError } from './frontend/src/utils/analysisEngine.js';

const tests = [
  { msg: "TypeError: x.map is not a function", context: "const x = 5;" },
  { msg: "ReferenceError: y is not defined", context: "" },
  { msg: "Uncaught TypeError: Cannot read properties of undefined (reading 'name')", context: "let user;" },
  { msg: "SyntaxError: Unexpected token '}'", context: "if(true){" },
  { msg: "Internal Error: something happened", context: "" }
];

tests.forEach((t, i) => {
  console.log(`--- TEST ${i + 1}: ${t.msg} ---`);
  const result = analyzeError(t.msg, t.context);
  console.log(JSON.stringify(result, null, 2));
  console.log("\n");
});
