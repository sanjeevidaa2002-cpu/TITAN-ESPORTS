const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

// Add props
content = content.replace(/export const Auth: React\.FC = \(\) => \{/, "export const Auth: React.FC<{ initialMode?: 'login' | 'signup', adminMode?: boolean }> = ({ initialMode = 'login', adminMode = false }) => {");

// Replace useState
content = content.replace(/const \[isRegistering, setIsRegistering\] = useState\(false\);/, "const [isRegistering, setIsRegistering] = useState(initialMode === 'signup');");

// Hide google login and create account toggle if adminMode
content = content.replace(/\{\!\!error && \(/, `{adminMode && (
          <div className="mb-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> Secure Admin Portal
          </div>
        )}
        {!!error && (`);

// Comment out the google login block when adminMode is true
content = content.replace(/<div className="flex items-center my-5">/g, "{!adminMode && <div className=\"flex items-center my-5\">");
content = content.replace(/<span>Continue with Google<\/span>\s*<\/button>\s*<\/>/g, "<span>Continue with Google</span>\n                </button>\n              </div>}</>");

// Fix toggle view for create account
content = content.replace(/<p className="text-center text-xs text-neutral-400 mt-6 font-medium">/g, "{!adminMode && <p className=\"text-center text-xs text-neutral-400 mt-6 font-medium\">");
content = content.replace(/<\/span>\s*<\/p>/g, "</span>\n        </p>}");

fs.writeFileSync('src/components/Auth.tsx', content);
