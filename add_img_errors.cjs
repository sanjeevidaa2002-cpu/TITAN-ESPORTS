const fs = require('fs');
let content = fs.readFileSync('src/components/LoadingPageManager.tsx', 'utf8');

content = content.replace(
  "const [typingTrigger, setTypingTrigger] = useState(0);",
  "const [typingTrigger, setTypingTrigger] = useState(0);\n  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});"
);

fs.writeFileSync('src/components/LoadingPageManager.tsx', content);
