const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /import \{ BrowserRouter, Routes, Route, Navigate, useLocation \} from 'react-router-dom';/,
  "import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';"
);

fs.writeFileSync('src/App.tsx', content);
