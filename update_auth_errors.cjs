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
  };`;

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

const registerOldStart = `  const registerWithEmail = async (
    email: string, 
    pass: string, 
    nickname: string, 
    freefireUid: string,
    referralCode?: string
  ) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);`;

const registerNewStart = `  const registerWithEmail = async (
    email: string, 
    pass: string, 
    nickname: string, 
    freefireUid: string,
    referralCode?: string
  ) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);`;

// Wait, where is the catch for registerWithEmail?
