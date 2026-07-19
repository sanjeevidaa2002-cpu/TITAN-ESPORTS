const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

// Replace the Tournament interface entirely or modify it to ensure all fields are exact
const match = content.match(/export interface Tournament \{([\s\S]*?)\}/);
if (match) {
  let inner = match[1];
  
  if (!inner.includes('enabled:')) inner += '\n  enabled?: boolean; // Enable/Disable Tournament';
  if (!inner.includes('matchCategory:')) inner += '\n  matchCategory?: "BR" | "CS" | string; // Battle Royale (BR) or Clash Squad (CS)';
  
  content = content.replace(/export interface Tournament \{([\s\S]*?)\}/, `export interface Tournament {${inner}}`);
  fs.writeFileSync('src/types.ts', content);
}
