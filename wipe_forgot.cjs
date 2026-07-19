const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

// The file currently has `{isForgot ? (` starting around line 150.
// Let's find it.
const isForgotIdx = content.indexOf('{isForgot ? (');
if (isForgotIdx !== -1) {
    // Find the matching `) : (` which leads to the main Auth form
    const mainFormIdx = content.indexOf(') : (', isForgotIdx);
    if (mainFormIdx !== -1) {
        // Cut out everything from `{isForgot ? (` to `) : (`
        // And remove `) : (` itself.
        const toRemove = content.substring(isForgotIdx, mainFormIdx + 5);
        content = content.replace(toRemove, '');
        fs.writeFileSync('src/components/Auth.tsx', content);
        console.log('Removed old isForgot block');
    }
}
