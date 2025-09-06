// Test file to check import resolution
const fs = require('fs');

console.log('Testing file existence...');
console.log('rasa-service.ts exists:', fs.existsSync('./lib/services/rasa-service.ts'));
console.log('conversational-orchestrator.ts exists:', fs.existsSync('./lib/services/conversational-orchestrator.ts'));

console.log('Reading conversational-orchestrator.ts...');
const content = fs.readFileSync('./lib/services/conversational-orchestrator.ts', 'utf8');
const firstLine = content.split('\n')[0];
console.log('First line:', firstLine);

