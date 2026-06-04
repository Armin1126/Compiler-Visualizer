package com.compiler.backend.models;

import lombok.Data;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;

@Data
public class CompilationResult {
    private String sourceCode;
    
    private List<Token> tokens = new ArrayList<>();
    private List<String> lexerErrors = new ArrayList<>();
    
    private AstNode ast;
    private List<String> parserErrors = new ArrayList<>();
    
    private Map<String, Symbol> symbolTables = new HashMap<>();
    private List<String> semanticErrors = new ArrayList<>();
    
    private List<TacInstruction> intermediateCode = new ArrayList<>();
    private List<TacInstruction> optimizedCode = new ArrayList<>();
    private List<AssemblyInstruction> assemblyCode = new ArrayList<>();
    
    private boolean success = true;
    private String currentPhase = "INIT";
}
