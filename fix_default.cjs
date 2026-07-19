const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'src/context/GameContext.tsx');
let content = fs.readFileSync(contextPath, 'utf8');

if (!content.includes("const DEFAULT_PROMO_SETTINGS")) {
  content = content.replace(
    "const GameContext = createContext<GameContextProps | undefined>(undefined);",
    "export const DEFAULT_PROMO_SETTINGS = { promoCodesEnabled: true };\n\nconst GameContext = createContext<GameContextProps | undefined>(undefined);"
  );
  fs.writeFileSync(contextPath, content);
  console.log("Fixed DEFAULT_PROMO_SETTINGS");
}
