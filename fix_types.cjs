const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

// Add fields to Tournament
const match = content.match(/export interface Tournament \{([\s\S]*?)\}/);
if (match) {
  let inner = match[1];
  
  // Ensure we have the new fields
  if (!inner.includes('gameName:')) inner += '\n  gameName?: string; // e.g. "Free Fire"';
  if (!inner.includes('category:')) inner += '\n  category?: "BR" | "CS" | string; // Battle Royale (BR) or Clash Squad (CS)';
  if (!inner.includes('matchType:')) inner += '\n  matchType?: "Solo" | "Duo" | "Squad" | string;';
  if (!inner.includes('tournamentName:')) inner += '\n  tournamentName?: string; // mapped from title';
  if (!inner.includes('thumbnailUrl:')) inner += '\n  thumbnailUrl?: string; // mapped from logoUrl';
  if (!inner.includes('description:')) inner += '\n  description?: string;';
  if (!inner.includes('registrationStart:')) inner += '\n  registrationStart?: string;';
  if (!inner.includes('registrationEnd:')) inner += '\n  registrationEnd?: string;';
  if (!inner.includes('matchDate:')) inner += '\n  matchDate?: string;';
  if (!inner.includes('matchTime:')) inner += '\n  matchTime?: string;';
  if (!inner.includes('status:')) inner += '\n  status?: string;';
  if (!inner.includes('createdAt:')) inner += '\n  createdAt?: string | number;';
  if (!inner.includes('updatedAt:')) inner += '\n  updatedAt?: string | number;';

  content = content.replace(/export interface Tournament \{([\s\S]*?)\}/, `export interface Tournament {${inner}}`);
  fs.writeFileSync('src/types.ts', content);
}
