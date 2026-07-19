const fs = require('fs');
let content = fs.readFileSync('src/components/Support.tsx', 'utf8');

content = content.replace("const [email, setEmail] = useState(userProfile?.email ?? '');", "const [mobile, setMobile] = useState(userProfile?.mobileNumber ?? '');");
content = content.replace("submitSupportMessage(name.trim(), email.trim(), message.trim(), 'contact_form')", "submitSupportMessage(name.trim(), mobile.trim(), message.trim(), 'contact_form')");

const oldSupportFormEmail = `                <div>
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Email address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="siralokesh2302@gmail.com"
                    className="w-full bg-[#161622] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500"
                  />
                </div>`;

const newSupportFormMobile = `                <div>
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Mobile Number</label>
                  <input 
                    type="tel" 
                    required
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-[#161622] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500"
                  />
                </div>`;

content = content.replace(oldSupportFormEmail, newSupportFormMobile);
content = content.replace("!name.trim() || !email.trim() || !message.trim()", "!name.trim() || !mobile.trim() || !message.trim()");
fs.writeFileSync('src/components/Support.tsx', content);
console.log('Fixed Support.tsx');
