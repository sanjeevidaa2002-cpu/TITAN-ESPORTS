const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

// The new inputs we need:
// login: usernameOrMobile, password
// signup: username, mobile, password, confirmPassword, refCode

content = content.replace("const { loginWithEmail, registerWithEmail", "const { loginWithCredentials, registerWithCredentials");

const inputsOld = `  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [freefireUid, setFreefireUid] = useState('');
  const [refCode, setRefCode] = useState('');`;

const inputsNew = `  // Form fields
  const [usernameOrMobile, setUsernameOrMobile] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [refCode, setRefCode] = useState('');`;

content = content.replace(inputsOld, inputsNew);

// Replace handle submit
const handleOld = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (password.length < 6) {
          setLocalErr("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, nickname, freefireUid, refCode);
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

const handleNew = `  const handleSubmit = async (e: React.FormEvent) => {
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
        await registerWithCredentials(username, mobile, password, refCode);
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

      if (errorCode === 'auth/wrong-password' || errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        setLocalErr("Incorrect password. Please verify your credentials and try again.");
      } else if (errorMessage) {
        setLocalErr(errorMessage);
      } else {
        setLocalErr("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(handleOld, handleNew);

// UI Update
const uiOld = `            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="titangaming4m@gmail.com"
                    className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                  />
                </div>
              </div>

              {isRegistering ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Referral Code (Optional)</label>
                    <p className="text-[10px] text-amber-500/80 mb-2 flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" /> Get ₹15 instant deposit cash by using a friend's code!
                    </p>
                    <input 
                      type="text" 
                      value={refCode}
                      onChange={e => setRefCode(e.target.value)}
                      placeholder="e.g. VA-LOK88"
                      className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-xs text-white uppercase focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                    />
                  </div>
                </>
              ) : (`;

const uiNew = `            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Profile Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        placeholder="e.g. TitanGamer"
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Mobile Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                      <input 
                        type="tel" 
                        value={mobile}
                        onChange={e => setMobile(e.target.value)}
                        required
                        placeholder="e.g. 9876543210"
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Referral Code (Optional)</label>
                    <p className="text-[10px] text-amber-500/80 mb-2 flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" /> Get ₹15 instant deposit cash!
                    </p>
                    <input 
                      type="text" 
                      value={refCode}
                      onChange={e => setRefCode(e.target.value)}
                      placeholder="e.g. VA-LOK88"
                      className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-xs text-white uppercase focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Username OR Mobile Number</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                      <input 
                        type="text" 
                        value={usernameOrMobile}
                        onChange={e => setUsernameOrMobile(e.target.value)}
                        required
                        placeholder="TitanGamer or 9876543210"
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button 
                      type="button"
                      onClick={() => { setIsForgot(true); setLocalErr(null); }}
                      className="text-xs text-gold-400 hover:text-gold-500 transition-all"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              )}`;

content = content.replace(uiOld, uiNew);

// Remove google login buttons
const googleOld = `            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-white/5 w-full" />
              <span className="bg-[#111116] px-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider absolute">Or Continue With</span>
            </div>

            {/* Google Sign-in */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>`;

content = content.replace(googleOld, "");

fs.writeFileSync('src/components/Auth.tsx', content);
console.log('Auth.tsx rewritten');
