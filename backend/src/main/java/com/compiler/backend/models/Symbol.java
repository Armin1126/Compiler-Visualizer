package com.compiler.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Symbol {
    private String name;
    private String type; // Number, String, etc.
    private boolean isDeclared;
    private boolean isInitialized;
    private Object currentValue; // Optional, for simulator or simple optimizations
}
