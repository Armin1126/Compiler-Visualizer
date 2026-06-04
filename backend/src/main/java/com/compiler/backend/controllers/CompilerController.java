package com.compiler.backend.controllers;

import com.compiler.backend.models.*;
import com.compiler.backend.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/compiler")
@CrossOrigin(origins = "*") // For development with frontend on different port
public class CompilerController {

    @Autowired
    private LexerService lexerService;

    @Autowired
    private ParserService parserService;

    @Autowired
    private SemanticAnalyzerService semanticService;

    @Autowired
    private IcgService icgService;

    @Autowired
    private OptimizerService optimizerService;

    @Autowired
    private CodegenService codegenService;

    @PostMapping("/compile")
    public CompilationResult compile(@RequestBody CompileRequest request) {
        CompilationResult result = new CompilationResult();
        result.setSourceCode(request.getSourceCode());
        
        try {
            // 1. Lexical Analysis
            result.setCurrentPhase("LEXER");
            List<Token> tokens = lexerService.tokenize(request.getSourceCode());
            result.setTokens(tokens);
            
            // 2. Syntax Analysis
            result.setCurrentPhase("PARSER");
            AstNode ast = parserService.parse(tokens, result.getParserErrors());
            result.setAst(ast);
            if (!result.getParserErrors().isEmpty()) {
                result.setSuccess(false);
                return result;
            }
            
            // 3. Semantic Analysis
            result.setCurrentPhase("SEMANTICS");
            semanticService.analyze(ast, result.getSymbolTables(), result.getSemanticErrors());
            if (!result.getSemanticErrors().isEmpty()) {
                result.setSuccess(false);
                return result;
            }
            
            // 4. Intermediate Code Generation
            result.setCurrentPhase("ICG");
            List<TacInstruction> tac = icgService.generate(ast);
            result.setIntermediateCode(tac);
            
            // 5. Code Optimization
            result.setCurrentPhase("OPTIMIZER");
            List<TacInstruction> optimized = optimizerService.optimize(tac);
            result.setOptimizedCode(optimized);
            
            // 6. Target Code Generation
            result.setCurrentPhase("CODEGEN");
            List<AssemblyInstruction> assembly = codegenService.generate(optimized);
            result.setAssemblyCode(assembly);
            
            result.setCurrentPhase("COMPLETED");
        } catch (Exception e) {
            result.setSuccess(false);
            result.getParserErrors().add("Unexpected error: " + e.getMessage());
        }
        
        return result;
    }
}
