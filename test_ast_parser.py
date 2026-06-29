import os, sys
sys.path.insert(0, 'backend')
from services.ast_parser import ASTParser

parser = ASTParser()

# Test Javascript extraction
js_code = """
import { helper } from './utils';
const auth = require('./auth');

function processRequest(req) {
  const user = auth.getUser(req);
  helper(user);
  return true;
}
"""

print("=== JS Imports ===")
js_imports = parser.extract_imports("app.js", js_code)
print(js_imports)

print("\n=== JS Functions ===")
js_funcs = parser.extract_functions("app.js", js_code)
for f in js_funcs:
    print(f"Func: {f['name']}, Lines: {f['start_line']}-{f['end_line']}, Calls: {f['calls']}")


# Test Python extraction
py_code = """
import os
from database import db_session

def save_user(username):
    db_session.add(username)
    db_session.commit()
"""

print("\n=== Py Imports ===")
py_imports = parser.extract_imports("main.py", py_code)
print(py_imports)

print("\n=== Py Functions ===")
py_funcs = parser.extract_functions("main.py", py_code)
for f in py_funcs:
    print(f"Func: {f['name']}, Lines: {f['start_line']}-{f['end_line']}, Calls: {f['calls']}")
