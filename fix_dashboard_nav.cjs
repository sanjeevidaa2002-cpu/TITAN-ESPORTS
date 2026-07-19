const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /if \(currentUser\) \{\n\s*const path = window\.location\.pathname;\n\s*if \(path === '\/login' \|\| path === '\/signup' \|\| path === '\/admin\/login'\) \{\n\s*window\.history\.replaceState\(null, '', '\/'\);\n\s*\}\n\s*\}/,
  `const navigate = useNavigate();
  useEffect(() => {
    if (currentUser) {
      const path = window.location.pathname;
      if (path === '/login' || path === '/signup') {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, navigate]);`
);

fs.writeFileSync('src/App.tsx', content);
