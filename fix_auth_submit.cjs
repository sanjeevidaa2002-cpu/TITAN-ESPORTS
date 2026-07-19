const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const oldSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await registerWithEmail(email, password, nickname, freefireUid, refCode.trim());
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.warn("Auth failed:", err);
      
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
        setLocalErr("This email address is already registered on TITAN ESP! Please switch to the 'Sign In' tab above to access your account.");
        setLoading(false);
        return;
      } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('invalid-email')) {
        setLocalErr("Invalid email format. Please check your email address and try again.");
        setLoading(false);
        return;
      } else if (errorCode === 'auth/weak-password' || errorMessage.includes('weak-password')) {
        setLocalErr("Password is too weak. Please use a password of at least 6 characters.");
        setLoading(false);
        return;
      } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorMessage.includes('wrong-password') || errorMessage.includes('user-not-found') || errorMessage.includes('invalid-credential')) {
        setLocalErr("Incorrect email address or password. Please verify your credentials and try again.");
        setLoading(false);
        return;
      } else if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('operation-not-allowed')) {
        setLocalErr("Email/Password authentication is disabled. Please enable it in Firebase Console -> Authentication -> Sign-in Method.");
        setLoading(false);
        return;
      } else if (errorMessage) {
        setLocalErr(errorMessage);
      } else {
        setLocalErr("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };`;

const newSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username.trim()) {
          setLocalErr("Username is required.");
          setLoading(false); return;
        }
        if (!mobile.trim()) {
          setLocalErr("Mobile Number is required.");
          setLoading(false); return;
        }
        if (password.length < 6) {
          setLocalErr("Password must be at least 6 characters.");
          setLoading(false); return;
        }
        if (password !== confirmPassword) {
          setLocalErr("Passwords do not match.");
          setLoading(false); return;
        }
        await registerWithCredentials(username, mobile, password, refCode.trim());
      } else {
        if (!usernameOrMobile.trim()) {
          setLocalErr("Please enter your Username or Mobile Number.");
          setLoading(false); return;
        }
        await loginWithCredentials(usernameOrMobile, password);
      }
    } catch (err: any) {
      console.warn("Auth failed:", err);
      
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (errorCode === 'auth/wrong-password' || errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential') || errorMessage.includes('not found')) {
        setLocalErr("Incorrect password or user not found. Please verify your credentials and try again.");
      } else if (errorMessage) {
        setLocalErr(errorMessage);
      } else {
        setLocalErr("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(oldSubmit, newSubmit);

const googleOld = `        try {
          await registerWithEmail('demo_user@gmail.com', 'demo123', 'lokesh meena', '55827391');
        } catch (inner) {`;

const googleNew = `        try {
          await registerWithCredentials('DemoUser123', '9876543210', 'demo123');
        } catch (inner) {`;

content = content.replace(googleOld, googleNew);

fs.writeFileSync('src/components/Auth.tsx', content);
console.log('Fixed Auth.tsx submit handler completely');
