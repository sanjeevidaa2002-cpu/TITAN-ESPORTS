const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

content = content.replace(
  /export const Auth: React\.FC<\{ initialMode\?: 'login' \| 'signup', adminMode\?: boolean \}> = \(\{ initialMode = 'login', adminMode = false \}\) => \{/,
  `import { useNavigate, useLocation } from 'react-router-dom';
export const Auth: React.FC<{ initialMode?: 'login' | 'signup', adminMode?: boolean }> = ({ initialMode = 'login', adminMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();`
);

content = content.replace(
  /const \{ loginWithCredentials, registerWithCredentials, loginWithGoogle, error, brandingSettings \} = useGame\(\);/,
  `const { currentUser, userProfile, loginWithCredentials, registerWithCredentials, loginWithGoogle, error, brandingSettings } = useGame();
  
  React.useEffect(() => {
    if (currentUser) {
      if (adminMode) {
        if (userProfile?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Normal user trying to log in via admin panel
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, userProfile, adminMode, navigate]);`
);

fs.writeFileSync('src/components/Auth.tsx', content);
