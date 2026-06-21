package com.compiler.backend.services;

import com.compiler.backend.models.AstNode;
import com.compiler.backend.models.Token;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;

@Service
public class ParserService {

    /**
     * Entry point — the singleton is stateless; all mutable state lives inside
     * a short-lived ParseContext that is created fresh for every call.
     * This makes concurrent requests completely independent of one another.
     */
    public AstNode parse(List<Token> tokens, List<String> errors) {
        return new ParseContext(tokens, errors).parseProgram();
    }

    // -----------------------------------------------------------------------
    // Inner context class — one instance per parse() invocation, never shared
    // -----------------------------------------------------------------------
    private static final class ParseContext {

        private final List<Token> tokens;
        private final List<String> errors;
        private int pos;

        ParseContext(List<Token> tokens, List<String> errors) {
            this.tokens = tokens;
            this.errors = errors != null ? errors : new ArrayList<>();
            this.pos    = 0;
        }

        AstNode parseProgram() {
            AstNode program = new AstNode("Program");
            while (!isAtEnd()) {
                try {
                    program.getBody().add(parseStatement());
                } catch (Exception e) {
                    this.errors.add("Parse error: " + e.getMessage());
                    synchronize();
                }
            }
            return program;
        }

        private AstNode parseStatement() {
            if (match("KEYWORD", "let")) {
                return parseDeclareStmt();
            }
            return parseAssignStmt();
        }

        private AstNode parseDeclareStmt() {
            Token identifier = consume("IDENTIFIER", "Expected variable name after 'let'.");
            consume("OPERATOR", "=", "Expected '=' after variable name.");
            AstNode expr = parseExpression();
            consume("PUNCTUATION", ";", "Expected ';' after expression.");

            AstNode stmt = new AstNode("DeclareStmt");
            stmt.setLeft(new AstNode("Identifier", identifier.getValue()));
            stmt.setRight(expr);
            return stmt;
        }

        private AstNode parseAssignStmt() {
            Token identifier = consume("IDENTIFIER", "Expected variable name.");
            consume("OPERATOR", "=", "Expected '=' after variable name.");
            AstNode expr = parseExpression();
            consume("PUNCTUATION", ";", "Expected ';' after expression.");

            AstNode stmt = new AstNode("AssignStmt");
            stmt.setLeft(new AstNode("Identifier", identifier.getValue()));
            stmt.setRight(expr);
            return stmt;
        }

        private AstNode parseExpression() {
            AstNode node = parseTerm();
            while (match("OPERATOR", "+", "-")) {
                Token op = previous();
                AstNode right = parseTerm();
                AstNode expr = new AstNode("BinaryExpression", op.getValue());
                expr.setLeft(node);
                expr.setRight(right);
                node = expr;
            }
            return node;
        }

        private AstNode parseTerm() {
            AstNode node = parseFactor();
            while (match("OPERATOR", "*", "/", "%")) {
                Token op = previous();
                AstNode right = parseFactor();
                AstNode expr = new AstNode("BinaryExpression", op.getValue());
                expr.setLeft(node);
                expr.setRight(right);
                node = expr;
            }
            return node;
        }

        private AstNode parseFactor() {
            if (match("NUMBER")) {
                return new AstNode("NumberLiteral", previous().getValue());
            }
            if (match("IDENTIFIER")) {
                return new AstNode("Identifier", previous().getValue());
            }
            if (match("PUNCTUATION", "(")) {
                AstNode expr = parseExpression();
                consume("PUNCTUATION", ")", "Expected ')' after expression.");
                return expr;
            }
            throw new RuntimeException(
                "Expected Number, Identifier, or '(' at line "
                + peek().getLine() + " token: " + peek().getValue());
        }

        // -------------------------------------------------------------------
        // Helpers — all read/write only this instance's fields
        // -------------------------------------------------------------------

        private boolean match(String type, String... values) {
            if (check(type, values)) {
                advance();
                return true;
            }
            return false;
        }

        private boolean check(String type, String... values) {
            if (isAtEnd()) return false;
            Token t = peek();
            if (!t.getType().equals(type)) return false;
            if (values.length == 0) return true;
            for (String v : values) {
                if (t.getValue().equals(v)) return true;
            }
            return false;
        }

        private Token consume(String type, String message) {
            if (check(type)) return advance();
            throw new RuntimeException(message + " at line " + peek().getLine());
        }

        private Token consume(String type, String value, String message) {
            if (check(type, value)) return advance();
            throw new RuntimeException(message + " at line " + peek().getLine());
        }

        private boolean isAtEnd() {
            return peek().getType().equals("EOF");
        }

        private Token peek() {
            return tokens.get(pos);
        }

        private Token previous() {
            return tokens.get(pos - 1);
        }

        private Token advance() {
            if (!isAtEnd()) pos++;
            return previous();
        }

        private void synchronize() {
            advance();
            while (!isAtEnd()) {
                if (previous().getValue().equals(";")) return;
                if (peek().getValue().equals("let")) return;
                advance();
            }
        }
    }
}
