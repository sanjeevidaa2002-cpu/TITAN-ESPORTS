const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const targetOld = `      } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorMessage.includes('wrong-password') || errorMessage.includes('user-not-found')) {
        setLocalErr("Incorrect email address or password. Please verify your credentials and try again.");
        setLoading(false);
        return;
      }`;

const targetNew = `      } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorMessage.includes('wrong-password') || errorMessage.includes('user-not-found') || errorMessage.includes('invalid-credential')) {
        setLocalErr("Incorrect email address or password. Please verify your credentials and try again.");
        setLoading(false);
        return;
      } else if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('operation-not-allowed')) {
        setLocalErr("Email/Password authentication is disabled. Please enable it in Firebase Console -> Authentication -> Sign-in Method.");
        setLoading(false);
        return;
      } else if (errorMessage) {
        setLocalErr(errorMessage);
        setLoading(false);
        return;
      }`;

content = content.replace(targetOld, targetNew);
fs.writeFileSync('src/components/Auth.tsx', content);
console.log('Fixed auth UI errors');
