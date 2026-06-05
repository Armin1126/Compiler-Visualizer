package com.compiler.backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.compiler.backend.models.Token;

@Service
public class LexerService {
    
    private static final String REGEX = 
        "(?<KEYWORD>\\blet\\b)|" +
        "(?<IDENTIFIER>[a-zA-Z_][a-zA-Z0-9_]*)|" +
        "(?<NUMBER>\\d+)|" +
        "(?<OPERATOR>[+\\-*/%=])|" +
        "(?<PUNCTUATION>[;()])|" +
        "(?<WHITESPACE>\\s+)|" +
        "(?<ERROR>.)";
        
    private static final Pattern PATTERN = Pattern.compile(REGEX);

    public List<Token> tokenize(String input) {
        List<Token> tokens = new ArrayList<>();
        if (input == null || input.isEmpty()) return tokens;
        
        Matcher matcher = PATTERN.matcher(input);
        int line = 1;
        int column = 1;
        
        while (matcher.find()) {
            int start = matcher.start();
            String value = matcher.group();
            
            if (matcher.group("WHITESPACE") != null) {
                for (char c : value.toCharArray()) {
                    if (c == '\n') {
                        line++;
                        column = 1;
                    } else {
                        column++;
                    }
                }
                continue;
            }
            
            String type = null;
            if (matcher.group("KEYWORD") != null) type = "KEYWORD";
            else if (matcher.group("IDENTIFIER") != null) type = "IDENTIFIER";
            else if (matcher.group("NUMBER") != null) type = "NUMBER";
            else if (matcher.group("OPERATOR") != null) type = "OPERATOR";
            else if (matcher.group("PUNCTUATION") != null) type = "PUNCTUATION";
            else type = "ERROR";
            
            tokens.add(new Token(type, value, line, column, start, matcher.end()));
            column += value.length();
        }
        
        tokens.add(new Token("EOF", "", line, column, input.length(), input.length()));
        return tokens;
    }
}
