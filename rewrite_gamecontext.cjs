const fs = require('fs');
let content = fs.readFileSync('src/context/GameContext.tsx', 'utf8');

// Replace registerWithEmail and loginWithEmail definitions and usage
content = content.replace(
  "registerWithEmail: (email: string, pass: string, nickname: string, freefireUid: string, referralCode?: string) => Promise<void>;",
  "registerWithCredentials: (username: string, mobile: string, pass: string, referralCode?: string) => Promise<void>;"
);

content = content.replace(
  "loginWithEmail: (email: string, pass: string) => Promise<void>;",
  "loginWithCredentials: (usernameOrMobile: string, pass: string) => Promise<void>;"
);

const loginOld = `  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e: any) {
      const msg = getAuthErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  };`;

const loginNew = `  const loginWithCredentials = async (usernameOrMobile: string, pass: string) => {
    setError(null);
    try {
      // Find the user by username or mobile
      let userDoc = null;
      const usersRef = collection(db, 'users');
      
      const qUsername = query(usersRef, where('nickname', '==', usernameOrMobile));
      const snapUsername = await getDocs(qUsername);
      if (!snapUsername.empty) {
        userDoc = snapUsername.docs[0].data();
      } else {
        const qMobile = query(usersRef, where('mobileNumber', '==', usernameOrMobile));
        const snapMobile = await getDocs(qMobile);
        if (!snapMobile.empty) {
          userDoc = snapMobile.docs[0].data();
        }
      }

      if (!userDoc) {
        throw new Error('Username or Mobile Number not found.');
      }
      
      if (userDoc.accountStatus === 'disabled') {
        throw new Error('Account Disabled. Please contact support.');
      }

      const email = userDoc.email;
      await signInWithEmailAndPassword(auth, email, pass);
      
      // Update last login
      if (auth.currentUser && !useLocalFallback) {
         await updateDoc(doc(db, 'users', auth.currentUser.uid), { lastLogin: new Date().toISOString() });
      }

    } catch (e: any) {
      if (e.message.includes('Username or Mobile Number not found') || e.message.includes('Account Disabled')) {
        setError(e.message);
        throw e;
      }
      const msg = getAuthErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  };`;

content = content.replace(loginOld, loginNew);

const registerOld = `  const registerWithEmail = async (
    email: string, 
    pass: string, 
    nickname: string, 
    freefireUid: string,
    referralCode?: string
  ) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      const uniqueReferral = 'VA-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const fallbackNickname = nickname.trim() || email.split('@')[0] || 'Gamer_' + Math.random().toString(36).substring(2, 6);
      const initialProfile: UserProfile = {
        uid: user.uid,
        email: email,
        nickname: fallbackNickname,
        freefireUid: freefireUid || '',
        avatarUrl: FF_AVATARS[Math.floor(Math.random() * FF_AVATARS.length)],
        depositBalance: referralCode ? 35 : 20, // Get extra if referred!
        winningBalance: 0,
        bonusBalance: referralCode ? 15 : 10,
        referralCode: uniqueReferral,
        referredBy: referralCode || undefined,
        totalMatches: 0,
        totalWins: 0,
        totalKills: 0,
        totalEarnings: 0,
        isNotificationEnabled: true,
        joinedAt: new Date().toISOString(),
        role: 'user'
      };

      if (!useLocalFallback) {
        await setDoc(doc(db, 'users', user.uid), initialProfile);
        
        // Add a promo transaction
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          amount: referralCode ? 50 : 30,
          type: 'referral_bonus',
          paymentMethod: 'System',
          dateTime: new Date().toISOString(),
          status: 'completed',
          description: referralCode ? 'Referred signup promo added!' : 'Sign up promotional balance added!'
        });
      } else {
        localStorage.setItem(\`profile_\${user.uid}\`, JSON.stringify(initialProfile));
        setUserProfile(initialProfile);
      }
    } catch (e: any) {
      const msg = getAuthErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  };`;

const registerNew = `  const registerWithCredentials = async (
    username: string, 
    mobile: string, 
    pass: string, 
    referralCode?: string
  ) => {
    setError(null);
    try {
      if (useLocalFallback) {
        throw new Error("Local fallback not fully supported for this flow");
      }

      const usersRef = collection(db, 'users');
      
      // Check username uniqueness
      const qUsername = query(usersRef, where('nickname', '==', username));
      const snapUsername = await getDocs(qUsername);
      if (!snapUsername.empty) {
        throw new Error('Username already exists. Please choose a different one.');
      }
      
      // Check mobile uniqueness
      const qMobile = query(usersRef, where('mobileNumber', '==', mobile));
      const snapMobile = await getDocs(qMobile);
      if (!snapMobile.empty) {
        throw new Error('Mobile Number already exists.');
      }

      // Generate hidden email for Firebase Auth
      const hiddenEmail = \`\${username.toLowerCase().replace(/[^a-z0-9]/g, '')}_\${Date.now()}@titanesp.app\`;

      const cred = await createUserWithEmailAndPassword(auth, hiddenEmail, pass);
      const user = cred.user;

      const uniqueReferral = 'TE-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const initialProfile: UserProfile = {
        uid: user.uid,
        email: hiddenEmail,
        nickname: username,
        mobileNumber: mobile,
        freefireUid: '',
        avatarUrl: FF_AVATARS[Math.floor(Math.random() * FF_AVATARS.length)],
        depositBalance: referralCode ? 35 : 20,
        winningBalance: 0,
        bonusBalance: referralCode ? 15 : 10,
        referralCode: uniqueReferral,
        referredBy: referralCode || undefined,
        totalMatches: 0,
        totalWins: 0,
        totalKills: 0,
        totalEarnings: 0,
        isNotificationEnabled: true,
        joinedAt: new Date().toISOString(),
        role: 'user',
        accountStatus: 'active',
        lastLogin: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), initialProfile);
      
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: referralCode ? 50 : 30,
        type: 'referral_bonus',
        paymentMethod: 'System',
        dateTime: new Date().toISOString(),
        status: 'completed',
        description: referralCode ? 'Referred signup promo added!' : 'Sign up promotional balance added!'
      });
      
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        setError(e.message);
        throw e;
      }
      const msg = getAuthErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    }
  };`;

content = content.replace(registerOld, registerNew);

content = content.replace("loginWithEmail,", "loginWithCredentials,");
content = content.replace("registerWithEmail,", "registerWithCredentials,");

fs.writeFileSync('src/context/GameContext.tsx', content);
console.log('GameContext rewritten');
