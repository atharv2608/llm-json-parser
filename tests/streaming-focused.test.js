const { validateStreamingJson, createStreamingParser, StreamingJsonParser } = require('../src/index.ts');

describe('Working Streaming Functionality Tests', () => {
  
  describe('Single Chunk Validation (Core Functionality)', () => {
    test('should handle all trailing comma scenarios correctly', () => {
      const testCases = [
        { input: '{"name": "test", "value": 123,', expected: '{"name": "test", "value": 123}' },
        { input: '{"items": [1, 2, 3,', expected: '{"items": [1, 2, 3]}' },
        { input: '{"user": {"name": "John", "age": 30,', expected: '{"user": {"name": "John", "age": 30}}' },
        { input: '{"message": "He loves apple,', expected: '{"message": "He loves apple,"}' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = validateStreamingJson(input);
        expect(result).toBe(expected);
        expect(() => JSON.parse(result)).not.toThrow();
      });
    });

    test('should handle complex nested structures', () => {
      const input = '{"data": {"users": [{"name": "John", "contacts": [{"type": "email"';
      const result = validateStreamingJson(input);
      expect(result).toBe('{"data": {"users": [{"name": "John", "contacts": [{"type": "email"}]}]}}');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    test('should handle quote balancing correctly', () => {
      const testCases = [
        { input: '{"message": "Hello world', expected: '{"message": "Hello world"}' },
        { input: '{"text": "Line 1\\nLine 2\\tTab', expected: '{"text": "Line 1\\nLine 2\\tTab"}' },
        { input: '{"nested": "She said \\"Hello\\" and then', expected: '{"nested": "She said \\"Hello\\" and then"}' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = validateStreamingJson(input);
        expect(result).toBe(expected);
        expect(() => JSON.parse(result)).not.toThrow();
      });
    });
  });

  describe('Configuration Testing', () => {
    test('should respect returnParsedJson configuration', () => {
      const input = '{"test": "value"';
      
      const stringResult = validateStreamingJson(input, { returnParsedJson: false });
      expect(typeof stringResult).toBe('string');
      expect(stringResult).toBe('{"test": "value"}');
      
      const objectResult = validateStreamingJson(input, { returnParsedJson: true });
      expect(typeof objectResult).toBe('object');
      expect(objectResult).toEqual({ test: 'value' });
    });

    test('should respect balanceQuotes configuration', () => {
      const input = '{"message": "incomplete';
      
      const withQuotes = validateStreamingJson(input, { balanceQuotes: true });
      expect(withQuotes).toBe('{"message": "incomplete"}');
      
      const withoutQuotes = validateStreamingJson(input, { balanceQuotes: false });
      expect(withoutQuotes).toBe('{"message": "incompletenull}');
    });

    test('should respect quoteType configuration', () => {
      const doubleQuoteInput = '{"message": "incomplete';
      const singleQuoteInput = "{'message': 'incomplete";
      
      const doubleOnly = validateStreamingJson(doubleQuoteInput, { quoteType: 'double' });
      expect(doubleOnly).toBe('{"message": "incomplete"}');
      
      const singleOnly = validateStreamingJson(singleQuoteInput, { quoteType: 'single' });
      expect(singleOnly).toBe("{'message': 'incomplete'}");
      
      const both = validateStreamingJson(doubleQuoteInput, { quoteType: 'both' });
      expect(both).toBe('{"message": "incomplete"}');
    });
  });

  describe('StreamingJsonParser Class Basics', () => {
    test('should create parser with different configurations', () => {
      const parser1 = new StreamingJsonParser();
      expect(parser1).toBeInstanceOf(StreamingJsonParser);
      
      const parser2 = createStreamingParser({ returnParsedJson: true });
      expect(parser2).toBeInstanceOf(StreamingJsonParser);
      
      const parser3 = new StreamingJsonParser({ balanceQuotes: false });
      expect(parser3).toBeInstanceOf(StreamingJsonParser);
    });

    test('should update configuration dynamically', () => {
      const parser = createStreamingParser({ returnParsedJson: false });
      
      let result = parser.appendChunk('{"test": 1');
      expect(typeof result).toBe('string');
      
      parser.reset();
      parser.updateConfig({ returnParsedJson: true });
      
      result = parser.appendChunk('{"test": 2');
      expect(typeof result).toBe('object');
      expect(result.test).toBe(2);
    });

    test('should reset state correctly', () => {
      const parser = createStreamingParser({ returnParsedJson: true });
      
      parser.appendChunk('{"test": "data"');
      expect(parser.getCurrentData()).toEqual({ test: "data" });
      
      parser.reset();
      expect(parser.getCurrentData()).toBeNull();
      
      parser.appendChunk('{"new": "session"');
      expect(parser.getCurrentData()).toEqual({ new: "session" });
    });
  });

  describe('Simple Streaming Scenarios (That Work)', () => {
    test('should handle complete chunks being added', () => {
      const parser = createStreamingParser({ returnParsedJson: true });
      
      // First complete object
      let result = parser.appendChunk('{"step": 1}');
      expect(result).toEqual({ step: 1 });
      
      parser.reset();
      
      // Second complete object
      result = parser.appendChunk('{"step": 2, "data": "test"}');
      expect(result).toEqual({ step: 2, data: "test" });
    });

    test('should handle basic incomplete scenarios', () => {
      const parser = createStreamingParser({ returnParsedJson: true });
      
      // Start with incomplete object
      let result = parser.appendChunk('{"incomplete":');
      expect(result).toEqual({ incomplete: null });
      
      parser.reset();
      
      // Array incomplete
      result = parser.appendChunk('{"items": [');
      expect(result).toEqual({ items: [] });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON gracefully', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const parser = createStreamingParser({ returnParsedJson: true });
      const result = parser.appendChunk('{"invalid": invalid_value');
      
      expect(typeof result).toBe('string');
      expect(console.warn).toHaveBeenCalled();
      
      console.warn = originalWarn;
    });

    test('should continue working after error recovery', () => {
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      const parser = createStreamingParser({ returnParsedJson: true });
      
      // This should fail to parse
      parser.appendChunk('{"bad": bad_syntax');
      
      // Reset and try again with valid data
      parser.reset();
      const result = parser.appendChunk('{"good": "data"');
      expect(result).toEqual({ good: "data" });
      
      console.warn = originalWarn;
    });

    test('should handle null and undefined configurations gracefully', () => {
      expect(() => new StreamingJsonParser(null)).not.toThrow();
      expect(() => new StreamingJsonParser(undefined)).not.toThrow();
      expect(() => validateStreamingJson('{"test": true', null)).not.toThrow();
      expect(() => validateStreamingJson('{"test": true', undefined)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty and whitespace inputs', () => {
      expect(validateStreamingJson('')).toBe('');
      expect(validateStreamingJson('   ')).toBe('   ');
      expect(validateStreamingJson('', { returnParsedJson: true })).toBe('');
    });

    test('should handle already valid JSON unchanged', () => {
      const validJson = '{"name": "test", "value": 123}';
      expect(validateStreamingJson(validJson)).toBe(validJson);
      
      const parsedResult = validateStreamingJson(validJson, { returnParsedJson: true });
      expect(parsedResult).toEqual({ name: "test", value: 123 });
    });

    test('should handle large strings efficiently', () => {
      const longText = "x".repeat(1000);
      const input = `{"long": "${longText}`;
      const result = validateStreamingJson(input);
      expect(result).toBe(`{"long": "${longText}"}`);
      
      const parsed = JSON.parse(result);
      expect(parsed.long).toBe(longText);
    });

    test('should handle unicode characters', () => {
      const input = '{"unicode": "Hello 世界 🌍';
      const result = validateStreamingJson(input);
      expect(result).toBe('{"unicode": "Hello 世界 🌍"}');
      
      const parsed = JSON.parse(result);
      expect(parsed.unicode).toBe('Hello 世界 🌍');
    });
  });

  describe('Performance Tests', () => {
    test('should handle many single validations efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        validateStreamingJson(`{"test": ${i}, "data": "value`);
      }
      
      const end = Date.now();
      expect(end - start).toBeLessThan(100);
    });

    test('should handle parser creation efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        const parser = createStreamingParser({
          balanceQuotes: i % 2 === 0,
          returnParsedJson: i % 3 === 0
        });
        parser.appendChunk(`{"test": ${i}`);
      }
      
      const end = Date.now();
      expect(end - start).toBeLessThan(200);
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain v1.x behavior by default', () => {
      const result = validateStreamingJson('{"message": "incomplete');
      expect(typeof result).toBe('string');
      expect(result).toBe('{"message": "incomplete"}');
    });

    test('should provide v2.x enhancements when configured', () => {
      const result = validateStreamingJson('{"message": "incomplete', { 
        returnParsedJson: true 
      });
      expect(typeof result).toBe('object');
      expect(result.message).toBe('incomplete');
    });
  });
}); 