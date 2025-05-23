# LLM JSON VALIDATOR

[![Version](https://img.shields.io/npm/v/llm-json-validator.svg)](https://www.npmjs.com/package/llm-json-validator)
[![License](https://img.shields.io/npm/l/llm-json-validator.svg)](https://github.com/atharv2608/llm-json-validator/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/llm-json-validator.svg)](https://www.npmjs.com/package/llm-json-validator)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A robust TypeScript utility library designed to handle incomplete and streaming JSON from Large Language Models (LLMs). Perfect for real-time AI applications where you need to process and validate JSON responses as they stream in.

## 🎯 Key Features

- **Intelligent JSON Completion**: Automatically fixes incomplete JSON structures
- **Streaming Support**: Process JSON chunks in real-time with state awareness
- **Quote & Bracket Balancing**: Smart handling of unmatched quotes and brackets
- **Configurable Dummy Values**: Customize placeholder values for incomplete data
- **TypeScript-First**: Full type safety with comprehensive type definitions
- **High Test Coverage**: 95%+ coverage across all metrics
- **Zero Dependencies**: Lightweight and self-contained
- **Backward Compatible**: Maintains compatibility with v1.x

## 📦 Installation

```bash
npm install llm-json-validator
# or
yarn add llm-json-validator
# or
pnpm add llm-json-validator
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { validateStreamingJson } from 'llm-json-validator';

// Handle incomplete JSON from an LLM
const incompleteJson = '{"name": "ChatGPT", "response": "Here is a list", "items": [1, 2,';
const result = validateStreamingJson(incompleteJson);
console.log(result);
// Output: '{"name": "ChatGPT", "response": "Here is a list", "items": [1, 2]}'
```

### Streaming API Integration

```typescript
import { createStreamingParser } from 'llm-json-validator';

const parser = createStreamingParser({
  returnParsedJson: true,  // Get parsed objects instead of strings
  dummyValues: {
    string: "loading...",
    number: 0,
    boolean: false,
    null: null
  }
});

// Process chunks as they arrive
async function handleStream(response: Response) {
  const reader = response.body?.getReader();
  let accumulated = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = new TextDecoder().decode(value);
    const result = parser.appendChunk(chunk);
    
    // result is a valid JSON object at each step!
    updateUI(result);
  }
}
```

## 🛠️ API Reference

### Configuration

```typescript
interface JsonParserConfig {
  // Enable/disable quote balancing (default: true)
  balanceQuotes?: boolean;
  
  // Quote type to balance: 'double' | 'single' | 'both' (default: 'both')
  quoteType?: 'double' | 'single' | 'both';
  
  // Return parsed JSON instead of string (default: false)
  returnParsedJson?: boolean;
  
  // Custom values for incomplete properties
  dummyValues?: {
    string?: string;    // Default: ""
    number?: number;    // Default: 0
    boolean?: boolean;  // Default: false
    null?: null;       // Default: null
  };
}
```

### Core Functions

#### `validateStreamingJson(input: string, config?: JsonParserConfig)`

Validates and completes a single JSON string:
```typescript
const result = validateStreamingJson(
  '{"status": "success", "data": [1, 2,',
  { returnParsedJson: true }
);
// Result: { status: "success", data: [1, 2] }
```

#### `createStreamingParser(config?: JsonParserConfig)`

Creates a stateful parser for handling streams:
```typescript
const parser = createStreamingParser({
  returnParsedJson: true,
  balanceQuotes: true
});

// Maintains state between chunks
parser.appendChunk('{"status":');        // { status: null }
parser.appendChunk('"loading"');         // { status: "loading" }
parser.appendChunk(', "progress": 50}'); // { status: "loading", progress: 50 }
```

### StreamingJsonParser Methods

- **appendChunk(chunk: string)**: Add new data and get updated result
- **reset()**: Clear parser state
- **getCurrentData()**: Get current parsed data
- **updateConfig(config: Partial<JsonParserConfig>)**: Update parser settings

## 🎯 Use Cases

### 1. AI Chat Applications
```typescript
const parser = createStreamingParser({ returnParsedJson: true });

chatStream.on('data', chunk => {
  const result = parser.appendChunk(chunk);
  if (result.messages?.length > 0) {
    updateChatUI(result.messages);
  }
});
```

### 2. Real-time Data Processing
```typescript
const parser = createStreamingParser({
  returnParsedJson: true,
  dummyValues: {
    number: 0,
    string: "loading..."
  }
});

dataStream.on('data', chunk => {
  const data = parser.appendChunk(chunk);
  updateDashboard(data);
});
```

### 3. Form Validation
```typescript
const validateForm = (partialJson: string) => {
  const result = validateStreamingJson(partialJson, {
    returnParsedJson: true,
    dummyValues: {
      string: "",
      number: null
    }
  });
  return result;
};
```

## 🔍 Advanced Features

### 1. Quote Handling
```typescript
// Handle mixed quotes
const input = '{"message": "Hello\'s World"}';
const result = validateStreamingJson(input, {
  balanceQuotes: true,
  quoteType: 'both'
});
```

### 2. Nested Structure Completion
```typescript
const input = '{"user": {"name": "John", "settings": {"theme":';
const result = validateStreamingJson(input);
// Result: '{"user": {"name": "John", "settings": {"theme": null}}}'
```

### 3. Array Handling
```typescript
const input = '{"items": [1, 2, {"id": 3, "data":';
const result = validateStreamingJson(input);
// Result: '{"items": [1, 2, {"id": 3, "data": null}]}'
```

## 🧪 Testing

The library maintains high test coverage:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Coverage Metrics:
- **Statements**: 95%+
- **Branches**: 95%+
- **Functions**: 100%
- **Lines**: 95%+

## 🔄 Version Migration

### Current Version (1.1.0)

The latest version (1.1.0) includes:
- Improved streaming support
- Better quote and bracket balancing
- Enhanced TypeScript types
- High test coverage (95%+)

### Upgrading to v1.1.0

```typescript
// v1.0.x - Still works!
const result = validateStreamingJson(json);

// v1.1.0 - Enhanced features
const result = validateStreamingJson(json, {
  returnParsedJson: true,
  dummyValues: {
    string: "loading..."
  }
});
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new features
4. Ensure tests pass: `npm test`
5. Submit a pull request

## 📝 License

MIT © [Atharv Lingayat](https://github.com/atharv2608)

## 🙋‍♂️ Support

- [GitHub Issues](https://github.com/atharv2608/llm-json-validator/issues)
- [Documentation](https://github.com/atharv2608/llm-json-validator#readme)
- [NPM Package](https://www.npmjs.com/package/llm-json-validator)

---

Made with ❤️ for the AI Developer Community
