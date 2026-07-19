const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const oldForgotBlock = `        {isForgot ? (
          /* Forgot Password View */
          <div className="glass-card-purple rounded-3xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-neon-purple/20">
            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">Reset Password</h2>
              <p className="text-xs text-neutral-400">
                Enter your registered email address and we will send you password recovery link.
              </p>
            </div>

            {forgotSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-xl mb-5 text-center">
                <p className="text-emerald-400 text-sm font-bold mb-1">Check your inbox!</p>
                <p className="text-xs text-emerald-200/70">A recovery link has been sent to your email address.</p>
              </div>
            ) : null}

            {(error || localErr) && !forgotSuccess ? (
              <div className="bg-red-950/40 border border-red-500/20 p-3.5 rounded-xl mb-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-200">
                  {localErr || error}
                </div>
              </div>
            ) : null}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-[#111116] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-neon-purple to-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all text-sm uppercase tracking-wider mt-4"
              >
                Send Recovery Link
              </button>
              <button
                type="button"
                onClick={() => { setIsForgot(false); setLocalErr(null); }}
                className="w-full text-xs text-neutral-400 hover:text-white transition-all text-center mt-3"
              >
                Back to Login
              </button>
            </form>
          </div>
        ) : (`;

content = content.replace(oldForgotBlock, "");

const oldForgotLogic = `  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setLocalErr("Please enter your registered email ID.");
      return;
    }
    setLocalErr(null);
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgot(false);
    }, 4000);
  };`;

content = content.replace(oldForgotLogic, "");

const theFinalParen = `          </div>
        )}
      </div>`;

content = content.replace(theFinalParen, `          </div>\n      </div>`);

const unusedForgotState = `  const [isForgot, setIsForgot] = useState(false);`;
content = content.replace(unusedForgotState, "");
content = content.replace(`  const [forgotSuccess, setForgotSuccess] = useState(false);`, "");


// Also replace the "Forgot Password?" button in Login view
const forgotBtnOld = `                  <div className="flex items-center justify-end">
                    <button 
                      type="button"
                      onClick={() => { setIsForgot(true); setLocalErr(null); }}
                      className="text-xs text-gold-400 hover:text-gold-500 transition-all"
                    >
                      Forgot Password?
                    </button>
                  </div>`;

content = content.replace(forgotBtnOld, "");

fs.writeFileSync('src/components/Auth.tsx', content);
console.log('Removed Forgot Password flow');
