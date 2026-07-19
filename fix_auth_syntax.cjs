const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

const regex = /React\.useEffect\(\(\) => \{[\s\S]*?\}, \[currentUser, userProfile, navigate\]\);/;
content = content.replace(regex, `React.useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);`);

fs.writeFileSync('src/components/Auth.tsx', content);
