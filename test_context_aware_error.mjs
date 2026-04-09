import { analyzeError } from './frontend/src/utils/analysisEngine.js';

const cases = [
  {
    name: "Scenario A: Contextual Type Mismatch (Number used as Array)",
    msg: "TypeError: x.map is not a function",
    context: "const x = 5;\nx.map(i => i);"
  },
  {
    name: "Scenario B: Undefined Variable with Context",
    msg: "TypeError: Cannot read properties of undefined (reading 'name')",
    context: "let user;\nconsole.log(user.name);"
  },
  {
    name: "Scenario C: ReferenceError without Context",
    msg: "ReferenceError: y is not defined",
    context: ""
  }
];

cases.forEach((c, i) => {
  console.log(`--- TEST ${i + 1}: ${c.name} ---`);
  const result = analyzeError(c.msg, c.context);
  console.log(JSON.stringify(result, null, 2));
  console.log("\n");
});
