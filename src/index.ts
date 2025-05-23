/**
 * Balances JSON brackets in a potentially incomplete JSON string by adding missing closing brackets.
 * Useful for handling streaming JSON data where the string might be cut off mid-stream.
 * @param input Potentially incomplete JSON string
 * @returns String with balanced JSON brackets
 */
export const validateStreamingJson = (input: string): string => {
    if (!input) return "";
  
    const stack: string[] = [];
    let result = input;
  
    // Process each character
    for (let i = 0; i < result.length; i++) {
      const char = result[i];
  
      if (char === "{" || char === "[") {
        stack.push(char === "{" ? "}" : "]");
      } else if (char === "}" || char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  
    while (stack.length > 0) {
      result += stack.pop();
    }
  
    return result;
  };