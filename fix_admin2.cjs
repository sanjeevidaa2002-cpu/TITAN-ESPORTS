const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Replace the end to include the closing div
content = content.replace(
  /      <\/main>\n    <\/div>\n  \);\n\};\n/m,
  `        </div>\n      </main>\n    </div>\n  );\n};\n`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
