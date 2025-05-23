# LLM JSON VALIDATOR

A lightweight TypeScript utility library for handling incomplete JSON data from Large Language Model outputs.

## Installation

```bash
npm install llm-json-validator
# or
yarn add llm-json-validator
# or
pnpm add llm-json-validator
```

## Usage

LLM JSON VALIDATOR helps you handle incomplete JSON data that might be received from streaming LLM outputs.

```typescript
import { validateStreamingJson } from 'llm-json-validator';

// Example with incomplete JSON
const incompleteJson = '{"name": "ChatGPT", "capabilities": ["text", "code", "images", {"advanced": [';
const balancedJson = validateStreamingJson(incompleteJson);
// Result: '{"name": "ChatGPT", "capabilities": ["text", "code", "images", {"advanced": []}]}'

// The balanced JSON can now be safely parsed
try {
  const data = JSON.parse(balancedJson);
  console.log(data);
} catch (error) {
  console.error('JSON parsing error:', error);
}
```

## API

### validateStreamingJson(input: string): string

Balances JSON brackets in a potentially incomplete JSON string by adding missing closing brackets.

- **Parameters:**
  - `input` (string): A potentially incomplete JSON string
  
- **Returns:**
  - (string): The input string with balanced JSON brackets

## Use Cases

- Handling streaming JSON data from LLM APIs
- Processing partial outputs during LLM response generation
- Creating more robust applications that interact with LLM outputs

## License

MIT © Atharv Lingayat
