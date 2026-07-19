const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileTab.tsx', 'utf8');

const oldHeader = `                  <p className="text-[10px] text-neutral-400 font-mono">
                    {userProfile?.email || 'siralokesh2302@gmail.com'}
                  </p>`;

const newHeader = `                  <p className="text-[10px] text-neutral-400 font-mono">
                    {userProfile?.mobileNumber || 'No Mobile Linked'}
                  </p>`;

content = content.replace(oldHeader, newHeader);

const oldEmailField = `                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Email Address</label>
                    <input 
                      type="text" 
                      value={userProfile?.email ?? ''}
                      readOnly
                      className="w-full bg-[#161622]/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-500 cursor-not-allowed"
                    />
                  </div>`;

const newMobileField = `                  <div>
                    <label className="text-[10px] text-neutral-400 mb-1 block uppercase font-bold">Mobile Number</label>
                    <input 
                      type="text" 
                      value={userProfile?.mobileNumber ?? ''}
                      readOnly
                      className="w-full bg-[#161622]/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-500 cursor-not-allowed"
                    />
                  </div>`;

content = content.replace(oldEmailField, newMobileField);
fs.writeFileSync('src/components/ProfileTab.tsx', content);
console.log('Updated ProfileTab');
