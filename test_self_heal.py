import os, sys
sys.path.insert(0, 'backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')
from services.self_heal_engine import SelfHealEngine

engine = SelfHealEngine()

code = """function greet(name) {
  return "Hello " + name;
}"""

comment = "String concatenation is a security risk. Use template literals instead."

try:
    result = engine.heal(code, comment, 'javascript')
    print("=== test_code ===")
    print(result['test_code'][:400])
    print("\n=== fail_result ===")
    print(result['fail_result'])
    print("\n=== fixed_code ===")
    print(result['fixed_code'])
    print("\n=== pass_result ===")
    print(result['pass_result'])
except Exception as e:
    print('ERROR:', e)
    import traceback; traceback.print_exc()
