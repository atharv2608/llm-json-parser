/**
 * Configuration options for the JSON parser
 */
export interface JsonParserConfig {
  /** Whether to balance unmatched quotes (default: true) */
  balanceQuotes?: boolean;
  /** Type of quotes to balance: 'double', 'single', or 'both' (default: 'both') */
  quoteType?: 'double' | 'single' | 'both';
  /** Whether to return parsed JSON object or string (default: false for backward compatibility) */
  returnParsedJson?: boolean;
  /** Custom dummy values to use when balancing incomplete structures */
  dummyValues?: {
    string?: string;
    number?: number;
    boolean?: boolean;
    null?: null;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<JsonParserConfig> = {
  balanceQuotes: true,
  quoteType: 'both',
  returnParsedJson: false,
  dummyValues: {
    string: '""',
    number: 0,
    boolean: false,
    null: null,
  },
};

/**
 * Class for handling streaming JSON parsing with append-aware functionality
 */
export class StreamingJsonParser {
  private config: Required<JsonParserConfig>;
  private lastParsedData: any = null;
  private lastBalancedString: string = '';
  private addedDummyValues: Array<{ position: number; value: string; type: string }> = [];

  constructor(config: JsonParserConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Updates the configuration
   */
  updateConfig(config: Partial<JsonParserConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Appends a new chunk and returns the updated parsed JSON
   */
  appendChunk(chunk: string): any | string {
    // If this is the first chunk, just process it normally
    if (!this.lastBalancedString) {
      const balancedResult = this.validateAndBalance(chunk);
      this.lastBalancedString = balancedResult.balanced;
      this.addedDummyValues = balancedResult.dummyValues;
    } else {
      // For subsequent chunks, we need to carefully merge with existing data
      let baseData = this.lastBalancedString;
      
      // Remove dummy values that were added to the end in the previous iteration
      // We only remove them if they're actually at the end and safe to remove
      if (this.addedDummyValues.length > 0) {
        // Sort by position descending to remove from end first
        const sortedDummies = [...this.addedDummyValues].sort((a, b) => b.position - a.position);
        
        for (const dummy of sortedDummies) {
          // Only remove if it's actually at the end of the string
          if (baseData.endsWith(dummy.value)) {
            baseData = baseData.slice(0, -dummy.value.length);
          }
        }
      }
      
      // Append the new chunk
      const newInput = baseData + chunk;
      
      // Reset dummy values tracking
      this.addedDummyValues = [];
      
      // Balance the new input
      const balancedResult = this.validateAndBalance(newInput);
      this.lastBalancedString = balancedResult.balanced;
      this.addedDummyValues = balancedResult.dummyValues;
    }

    if (this.config.returnParsedJson) {
      try {
        this.lastParsedData = JSON.parse(this.lastBalancedString);
        return this.lastParsedData;
      } catch (error) {
        // If parsing fails, return the balanced string and log the error for debugging
        console.warn('JSON parsing failed, returning balanced string:', error instanceof Error ? error.message : 'Unknown error');
        console.warn('Attempted to parse:', this.lastBalancedString);
        return this.lastBalancedString;
      }
    }

    return this.lastBalancedString;
  }

  /**
   * Resets the parser state
   */
  reset(): void {
    this.lastParsedData = null;
    this.lastBalancedString = '';
    this.addedDummyValues = [];
  }

  /**
   * Gets the current parsed data without processing new input
   */
  getCurrentData(): any | string {
    return this.config.returnParsedJson ? this.lastParsedData : this.lastBalancedString;
  }

  /**
   * Internal method to validate and balance JSON with tracking of dummy values
   */
  private validateAndBalance(input: string): { balanced: string; dummyValues: Array<{ position: number; value: string; type: string }> } {
    if (!input) return { balanced: '', dummyValues: [] };

    let result = input;
    const dummyValues: Array<{ position: number; value: string; type: string }> = [];

    // Balance quotes first if enabled
    if (this.config.balanceQuotes) {
      const quoteResult = this.balanceQuotes(result);
      result = quoteResult.balanced;
      dummyValues.push(...quoteResult.dummyValues);
    }

    // Balance brackets
    const bracketResult = this.balanceBrackets(result);
    result = bracketResult.balanced;
    dummyValues.push(...bracketResult.dummyValues);

    return { balanced: result, dummyValues };
  }

  /**
   * Balance quotes in the JSON string
   */
  private balanceQuotes(input: string): { balanced: string; dummyValues: Array<{ position: number; value: string; type: string }> } {
    const dummyValues: Array<{ position: number; value: string; type: string }> = [];
    let result = input;
    let inString = false;
    let stringChar = '';
    let escaped = false;

    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      const shouldProcessQuote = 
        (this.config.quoteType === 'both') ||
        (this.config.quoteType === 'double' && char === '"') ||
        (this.config.quoteType === 'single' && char === "'");

      if (shouldProcessQuote && (char === '"' || char === "'")) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
    }

    // If we're still in a string, close it
    if (inString && stringChar) {
      result += stringChar;
      dummyValues.push({
        position: result.length - 1,
        value: stringChar,
        type: 'quote'
      });
    }

    return { balanced: result, dummyValues };
  }

  /**
   * Balance brackets in the JSON string
   */
  private balanceBrackets(input: string): { balanced: string; dummyValues: Array<{ position: number; value: string; type: string }> } {
    const stack: string[] = [];
    const dummyValues: Array<{ position: number; value: string; type: string }> = [];
    let result = input;
    let inString = false;
    let stringChar = '';
    let escaped = false;
    let lastNonWhitespaceChar = '';
    let lastNonWhitespaceIndex = -1;

    // First pass: track what brackets are open and analyze the structure
    for (let i = 0; i < result.length; i++) {
      const char = result[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        inString = false;
        stringChar = '';
      }

      if (!inString) {
        if (char === "{" || char === "[") {
          stack.push(char === "{" ? "}" : "]");
        } else if (char === "}" || char === "]") {
          if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
          }
        }
        
        // Track the last non-whitespace character for context
        if (char.trim() !== '') {
          lastNonWhitespaceChar = char;
          lastNonWhitespaceIndex = i;
        }
      }
    }

    // Check if we need to add a value before closing brackets
    const needsValue = lastNonWhitespaceChar === ':' || lastNonWhitespaceChar === '[' || lastNonWhitespaceChar === ',';
    
    if (needsValue && stack.length > 0) {
      // Add a placeholder value based on context
      if (lastNonWhitespaceChar === ':') {
        result += 'null';
        dummyValues.push({
          position: result.length - 4,
          value: 'null',
          type: 'value'
        });
      } else if (lastNonWhitespaceChar === '[' || lastNonWhitespaceChar === ',') {
        // For arrays, we don't need to add anything, just close
      }
    }

    // Close remaining brackets
    while (stack.length > 0) {
      const closingBracket = stack.pop()!;
      result += closingBracket;
      dummyValues.push({
        position: result.length - 1,
        value: closingBracket,
        type: 'bracket'
      });
    }

    return { balanced: result, dummyValues };
  }
}

/**
 * Balances JSON brackets in a potentially incomplete JSON string by adding missing closing brackets.
 * Useful for handling streaming JSON data where the string might be cut off mid-stream.
 * @param input Potentially incomplete JSON string
 * @param config Optional configuration for parsing behavior
 * @returns String with balanced JSON brackets or parsed JSON object based on config
 */
export const validateStreamingJson = (input: string, config: JsonParserConfig = {}): string | any => {
  const parser = new StreamingJsonParser(config);
  return parser.appendChunk(input);
};

/**
 * Creates a new streaming JSON parser instance
 * @param config Configuration options for the parser
 * @returns StreamingJsonParser instance
 */
export const createStreamingParser = (config: JsonParserConfig = {}): StreamingJsonParser => {
  return new StreamingJsonParser(config);
};