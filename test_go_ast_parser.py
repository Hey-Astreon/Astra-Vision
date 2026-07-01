from backend.services.ast_parser import ASTParser

def test_go_ast():
    parser = ASTParser()
    
    go_code = """
package main

import (
    "fmt"
    "os"
)

import "net/http"

type User struct {
    ID   int
    Name string
}

func GetUser(id int) User {
    return User{ID: id, Name: "Astreon"}
}

func (u *User) Greet() string {
    return fmt.Sprintf("Hello %s", u.Name)
}
"""
    # 1. Test functions and structs extraction
    functions = parser.extract_functions("main.go", go_code)
    print("\n--- Go Chunks Extracted ---")
    for f in functions:
        print(f"Name: {f['name']}, Type: {f['type']}, Lines: {f['start_line']}-{f['end_line']}")
        
    # Assert we found the struct, the function, and the receiver method
    names = [f["name"] for f in functions]
    assert "User" in names, "Failed to parse User struct"
    assert "GetUser" in names, "Failed to parse GetUser function"
    assert "Greet" in names, "Failed to parse Greet receiver method"
    
    # Check types
    for f in functions:
        if f["name"] == "User":
            assert f["type"] == "class", "User struct should be mapped to class type"
        elif f["name"] in ("GetUser", "Greet"):
            assert f["type"] == "function", "Functions/Methods should be mapped to function type"

    # 2. Test imports extraction
    imports = parser.extract_imports("main.go", go_code)
    print("\n--- Go Imports Extracted ---")
    for imp in imports:
        print(f"Imported from: {imp['imported_from']}")
        
    imported_libs = [imp["imported_from"] for imp in imports]
    assert "fmt" in imported_libs, "Failed to parse fmt import"
    assert "os" in imported_libs, "Failed to parse os import"
    assert "net/http" in imported_libs, "Failed to parse net/http import"
    
    print("\n[OK] Go AST parsing logic validated successfully!")

if __name__ == "__main__":
    test_go_ast()
