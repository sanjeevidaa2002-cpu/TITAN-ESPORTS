const fs = require('fs');
let content = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

const getAuthErrorMsg = `  const getAuthErrorMessage = (error: any) => {
    const code = error.code || error.message || '';
    if (code.includes('auth/email-already-in-use')) return 'Email already exists.';
    if (code.includes('auth/invalid-email')) return 'Invalid email address.';
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) return 'Incorrect password or user not found.';
    if (code.includes('auth/user-not-found')) return 'User not found.';
    if (code.includes('auth/operation-not-allowed')) return 'Email/Password authentication is disabled. Please enable it in Firebase Console -> Authentication -> Sign-in Method.';
    if (code.includes('auth/network-request-failed')) return 'Network error. Please check your connection.';
    return error.message || 'An authentication error occurred.';
  };

`;

const loginOld = `  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
      setError(e.message || "Failed to log in.");
      throw e;
    }
  };`;

const loginNew = `  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
      const msg = getAuthErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  };`;

const registerOldCatch = `    } catch (e: any) {
      setError(e.message || "Failed to register.");
      throw e;
    }
  };`;

const registerNewCatch = `    } catch (e: any) {
      const msg = getAuthErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  };`;

if (!content.includes('getAuthErrorMessage')) {
  content = content.replace('  // Auth Operations', '  // Auth Operations\n' + getAuthErrorMsg);
  content = content.replace(loginOld, loginNew);
  content = content.replace(registerOldCatch, registerNewCatch);
  fs.writeFileSync('src/context/GameContext.tsx', content);
  console.log('Fixed auth errors');
} else {
  console.log('Already fixed?');
}
