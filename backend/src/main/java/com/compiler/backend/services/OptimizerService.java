package com.compiler.backend.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.compiler.backend.models.TacInstruction;

@Service
public class OptimizerService {

    public List<TacInstruction> optimize(List<TacInstruction> input) {
        List<TacInstruction> optimized = new ArrayList<>();
        Map<String, String> constants = new HashMap<>();
        
        for (TacInstruction inst : input) {
            String op = inst.getOp();
            String arg1 = inst.getArg1();
            String arg2 = inst.getArg2();
            String res = inst.getResult();
            
            // 1. Substitute variables with constants if known
            if (arg1 != null && constants.containsKey(arg1)) {
                arg1 = constants.get(arg1);
            }
            if (arg2 != null && constants.containsKey(arg2)) {
                arg2 = constants.get(arg2);
            }
            
            // 2. Perform Constant Propagation & Folding
            if (op.equals("=")) {
                // If it's a simple assignment
                if (isNumber(arg1)) {
                    constants.put(res, arg1);
                } else {
                    constants.remove(res);
                }
                optimized.add(new TacInstruction("=", arg1, null, res));
            } else if (isOperator(op)) {
                // If it's a binary operation
                if (isNumber(arg1) && isNumber(arg2)) {
                    int val1 = Integer.parseInt(arg1);
                    int val2 = Integer.parseInt(arg2);
                    int folded = switch (op) {
                        case "+" -> val1 + val2;
                        case "-" -> val1 - val2;
                        case "*" -> val1 * val2;
                        case "/" -> val2 != 0 ? val1 / val2 : 0;
                        case "%" -> val2 != 0 ? val1 % val2 : 0;
                        default -> 0;
                    };
                    String foldedStr = String.valueOf(folded);
                    constants.put(res, foldedStr);
                    optimized.add(new TacInstruction("=", foldedStr, null, res));
                } else {
                    // Algebraic Simplifications
                    boolean simplified = false;
                    
                    // x * 1 -> x or 1 * x -> x
                    if (op.equals("*") && "1".equals(arg2)) {
                        optimized.add(new TacInstruction("=", arg1, null, res));
                        updateConstantsMap(res, arg1, constants);
                        simplified = true;
                    } else if (op.equals("*") && "1".equals(arg1)) {
                        optimized.add(new TacInstruction("=", arg2, null, res));
                        updateConstantsMap(res, arg2, constants);
                        simplified = true;
                    }
                    // x + 0 -> x or 0 + x -> x
                    else if (op.equals("+") && "0".equals(arg2)) {
                        optimized.add(new TacInstruction("=", arg1, null, res));
                        updateConstantsMap(res, arg1, constants);
                        simplified = true;
                    } else if (op.equals("+") && "0".equals(arg1)) {
                        optimized.add(new TacInstruction("=", arg2, null, res));
                        updateConstantsMap(res, arg2, constants);
                        simplified = true;
                    }
                    // x - 0 -> x
                    else if (op.equals("-") && "0".equals(arg2)) {
                        optimized.add(new TacInstruction("=", arg1, null, res));
                        updateConstantsMap(res, arg1, constants);
                        simplified = true;
                    }
                    // x * 0 -> 0 or 0 * x -> 0
                    else if (op.equals("*") && ("0".equals(arg1) || "0".equals(arg2))) {
                        optimized.add(new TacInstruction("=", "0", null, res));
                        constants.put(res, "0");
                        simplified = true;
                    }
                    // x / 1 -> x
                    else if (op.equals("/") && "1".equals(arg2)) {
                        optimized.add(new TacInstruction("=", arg1, null, res));
                        updateConstantsMap(res, arg1, constants);
                        simplified = true;
                    }
                    // x - x -> 0
                    else if (op.equals("-") && arg1 != null && arg1.equals(arg2)) {
                        optimized.add(new TacInstruction("=", "0", null, res));
                        constants.put(res, "0");
                        simplified = true;
                    }
                    
                    if (!simplified) {
                        constants.remove(res);
                        optimized.add(new TacInstruction(op, arg1, arg2, res));
                    }
                }
            } else {
                // E.g. "let" instruction
                constants.remove(res);
                optimized.add(new TacInstruction(op, arg1, arg2, res));
            }
        }
        
        return optimized;
    }
    
    private void updateConstantsMap(String res, String value, Map<String, String> constants) {
        if (isNumber(value)) {
            constants.put(res, value);
        } else if (constants.containsKey(value)) {
            constants.put(res, constants.get(value));
        } else {
            constants.remove(res);
        }
    }
    
    private boolean isOperator(String op) {
        return op.equals("+") || op.equals("-") || op.equals("*") || op.equals("/") || op.equals("%");
    }
    
    private boolean isNumber(String str) {
        if (str == null) return false;
        try {
            Integer.parseInt(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
