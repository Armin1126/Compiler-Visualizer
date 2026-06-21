package com.compiler.backend.controllers;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.compiler.backend.models.AssemblyInstruction;
import com.compiler.backend.models.AstNode;
import com.compiler.backend.models.CompilationResult;
import com.compiler.backend.models.CompileRequest;
import com.compiler.backend.models.TacInstruction;
import com.compiler.backend.models.Token;
import com.compiler.backend.services.CodegenService;
import com.compiler.backend.services.IcgService;
import com.compiler.backend.services.LexerService;
import com.compiler.backend.services.OptimizerService;
import com.compiler.backend.services.ParserService;
import com.compiler.backend.services.SemanticAnalyzerService;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/compiler")
public class CompilerController {

    private static final Logger log = LoggerFactory.getLogger(CompilerController.class);

    // --- Rate-limiting config ---
    // Each unique IP gets its own bucket:
    //   • Refill: 20 tokens every 1 minute (steady-state throughput)
    //   • Burst:   5 tokens available immediately on first request
    private static final int REFILL_TOKENS   = 20;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);
    private static final int BURST_CAPACITY  = 5;

    // --- Input size limit (characters) ---
    private static final int MAX_SOURCE_LENGTH = 8_000;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

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

    // -----------------------------------------------------------------------
    // POST /api/compiler/compile
    // -----------------------------------------------------------------------
    @PostMapping("/compile")
    public ResponseEntity<?> compile(@RequestBody CompileRequest request,
                                     HttpServletRequest httpRequest) {

        // 1. Rate-limit check
        String clientIp = resolveClientIp(httpRequest);
        Bucket bucket = buckets.computeIfAbsent(clientIp, this::newBucket);
        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            return ResponseEntity
                    .status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please wait a moment and try again."));
        }

        // 2. Input size check
        String sourceCode = request.getSourceCode();
        if (sourceCode == null || sourceCode.isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Source code must not be empty."));
        }
        if (sourceCode.length() > MAX_SOURCE_LENGTH) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error",
                            "Source code exceeds the maximum allowed length of "
                            + MAX_SOURCE_LENGTH + " characters."));
        }

        // 3. Compile pipeline
        CompilationResult result = new CompilationResult();
        result.setSourceCode(sourceCode);

        try {
            // Phase 1 — Lexical Analysis
            result.setCurrentPhase("LEXER");
            List<Token> tokens = lexerService.tokenize(sourceCode);
            result.setTokens(tokens);

            // Phase 2 — Syntax Analysis
            result.setCurrentPhase("PARSER");
            AstNode ast = parserService.parse(tokens, result.getParserErrors());
            result.setAst(ast);
            if (!result.getParserErrors().isEmpty()) {
                result.setSuccess(false);
                return ResponseEntity.ok(result);
            }

            // Phase 3 — Semantic Analysis
            result.setCurrentPhase("SEMANTICS");
            semanticService.analyze(ast, result.getSymbolTables(), result.getSemanticErrors());
            if (!result.getSemanticErrors().isEmpty()) {
                result.setSuccess(false);
                return ResponseEntity.ok(result);
            }

            // Phase 4 — Intermediate Code Generation
            result.setCurrentPhase("ICG");
            List<TacInstruction> tac = icgService.generate(ast);
            result.setIntermediateCode(tac);

            // Phase 5 — Code Optimization
            result.setCurrentPhase("OPTIMIZER");
            List<TacInstruction> optimized = optimizerService.optimize(tac);
            result.setOptimizedCode(optimized);

            // Phase 6 — Target Code Generation
            result.setCurrentPhase("CODEGEN");
            List<AssemblyInstruction> assembly = codegenService.generate(optimized);
            result.setAssemblyCode(assembly);

            result.setCurrentPhase("COMPLETED");

        } catch (Exception e) {
            // Log the real cause server-side; never leak internals to the client
            log.error("Unexpected error during compilation for IP {}: {}", clientIp, e.getMessage(), e);
            result.setSuccess(false);
            result.getParserErrors().add("An internal error occurred. Please try again.");
        }

        return ResponseEntity.ok(result);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Creates a new Bucket4j token-bucket for a given IP.
     * Burst capacity allows a short initial spike; the refill policy
     * enforces the sustained throughput limit.
     */
    private Bucket newBucket(String ip) {
        Bandwidth burst  = Bandwidth.classic(BURST_CAPACITY,
                               Refill.intervally(BURST_CAPACITY, REFILL_PERIOD));
        Bandwidth refill = Bandwidth.classic(REFILL_TOKENS,
                               Refill.greedy(REFILL_TOKENS, REFILL_PERIOD));
        return Bucket.builder()
                .addLimit(burst)
                .addLimit(refill)
                .build();
    }

    /**
     * Extracts the real client IP, honouring the X-Forwarded-For header
     * set by Render's / Vercel's reverse-proxy layer.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For can be "client, proxy1, proxy2" — take the first
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
