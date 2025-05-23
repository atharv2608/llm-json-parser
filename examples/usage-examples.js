const { validateStreamingJson, createStreamingParser } = require('../dist/index');

console.log('=== LLM JSON Validator Examples ===\n');

// Example 1: Basic usage (backward compatible)
console.log('1. Basic Usage (Backward Compatible):');
const incompleteJson1 = '{"name": "ChatGPT", "capabilities": ["text", "code", "images", {"advanced": [';
const balanced1 = validateStreamingJson(incompleteJson1);
console.log('Input:', incompleteJson1);
console.log('Output:', balanced1);
console.log('Parsed:', JSON.parse(balanced1));
console.log();

// Example 2: Quote balancing
console.log('2. Quote Balancing:');
const incompleteQuotes = '{"message": "Hello world", "incomplete": "missing quote';
const balancedQuotes = validateStreamingJson(incompleteQuotes, { balanceQuotes: true });
console.log('Input:', incompleteQuotes);
console.log('Output:', balancedQuotes);
console.log('Parsed:', JSON.parse(balancedQuotes));
console.log();

// Example 3: Return parsed JSON directly
console.log('3. Return Parsed JSON Directly:');
const config = {
  balanceQuotes: true,
  quoteType: 'both',
  returnParsedJson: true
};
const parsedDirectly = validateStreamingJson(incompleteQuotes, config);
console.log('Input:', incompleteQuotes);
console.log('Parsed Output:', parsedDirectly);
console.log('Type:', typeof parsedDirectly);
console.log();

// Example 4: Streaming parser with append-aware functionality
console.log('4. Streaming Parser (Append-Aware):');
const parser = createStreamingParser({
  returnParsedJson: true,
  balanceQuotes: true
});

const chunks = [
  '{"response":',
  ' "This is a ',
  'streaming response",',
  ' "data": [1,',
  ' 2, 3], "status":',
  ' "complete"}'
];

chunks.forEach((chunk, index) => {
  const currentData = parser.appendChunk(chunk);
  console.log(`Chunk ${index + 1}: "${chunk}"`);
  console.log(`Current Data:`, currentData);
  console.log();
});

// Example 5: Single vs Double quotes configuration
console.log('5. Quote Type Configuration:');

const singleQuoteJson = "{'message': 'Hello world";
const doubleQuoteJson = '{"message": "Hello world';

console.log('Single quotes only:');
console.log('Input:', singleQuoteJson);
console.log('Output:', validateStreamingJson(singleQuoteJson, { quoteType: 'single' }));

console.log('Double quotes only:');
console.log('Input:', doubleQuoteJson);
console.log('Output:', validateStreamingJson(doubleQuoteJson, { quoteType: 'double' }));
console.log();

// Example 6: Complex nested structures
console.log('6. Complex Nested Structures:');
const complexIncomplete = `{
  "analysis": {
    "sentiment": "positive",
    "scores": [0.8, 0.9,
    "metadata": {
      "confidence": 0.95,
      "tags": ["good", "excellent"`;

const complexBalanced = validateStreamingJson(complexIncomplete, {
  returnParsedJson: true,
  balanceQuotes: true
});

console.log('Input:', complexIncomplete);
console.log('Parsed Output:', JSON.stringify(complexBalanced, null, 2));
console.log();

// Example 7: Reset and reuse parser
console.log('7. Parser Reset and Reuse:');
parser.reset();
const newChunk = '{"newSession": "started", "user":';
const newResult = parser.appendChunk(newChunk);
console.log('After reset, new chunk:', newChunk);
console.log('Result:', newResult);
console.log();

console.log('=== All Examples Complete ==='); 