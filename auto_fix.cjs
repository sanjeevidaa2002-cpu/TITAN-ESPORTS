const { execSync } = require('child_process');
const fs = require('fs');

let success = false;
for (let i = 0; i < 20; i++) {
  try {
    execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs', { stdio: 'pipe' });
    success = true;
    console.log("Success!");
    break;
  } catch (err) {
    const output = err.stderr.toString();
    const match = output.match(/server\.ts:(\d+):\d+:/);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      console.log("Error at line", lineNum, ". Deleting it...");
      let lines = fs.readFileSync('server.ts', 'utf8').split('\n');
      // Look around to delete the stray `      }` or `  });`
      if (lines[lineNum - 1].trim() === '});' || lines[lineNum - 1].trim() === '}') {
        lines.splice(lineNum - 1, 1);
        // Also check if the previous line is `      }`
        if (lines[lineNum - 2] && lines[lineNum - 2].trim() === '}') {
            lines.splice(lineNum - 2, 1);
        }
      }
      fs.writeFileSync('server.ts', lines.join('\n'));
    } else {
      console.log("Could not parse error:", output);
      break;
    }
  }
}
