const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir(path.join(__dirname, 'src'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Simple regex for console.error("...", err) or console.warn("...", err)
    content = content.replace(/console\.(error|warn)\(("[^"]*?"|`[^`]*?`|'[^']*?'),\s*(err|e|error|detailErr|upcomingErr|zapErr|altErr)\);/g, 'console.$1($2);');
    // Also cases like console.error(err)
    content = content.replace(/console\.(error|warn)\((err|e|error|detailErr|upcomingErr|zapErr|altErr)\);/g, 'console.$1("An error occurred");');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log("Patched", filePath);
    }
  }
});
