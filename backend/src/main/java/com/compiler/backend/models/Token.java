package com.compiler.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Token {
    private String type; // KEYWORD, IDENTIFIER, NUMBER, OPERATOR, PUNCTUATION, EOF, ERROR
    private String value;
    private int line;
    private int column;
    private int start;
    private int end;
}
