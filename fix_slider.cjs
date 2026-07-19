const fs = require('fs');
let content = fs.readFileSync('src/components/HomepageBannerSlider.tsx', 'utf8');

// Replace the start of the component to add cache logic
const anchor = `export const HomepageBannerSlider: React.FC = () => {
  const { homepageBanners } = useGame();

  const activeBanners = homepageBanners.filter(b => b.enabled).sort((a, b) => a.displayOrder - b.displayOrder);
  
  const [currentIndex, setCurrentIndex] = useState(0);`;

const replacement = `export const HomepageBannerSlider: React.FC = () => {
  const { homepageBanners } = useGame();
  
  // Local cached state for immediate rendering
  const [cachedBanners, setCachedBanners] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('titan_banner_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Preload first cached image
        if (parsed.length > 0) {
           const img = new Image();
           img.src = parsed[0].imageUrl;
        }
        return parsed;
      }
    } catch (e) {}
    return [];
  });

  const activeBanners = React.useMemo(() => {
    if (homepageBanners && homepageBanners.length > 0) {
      const active = homepageBanners.filter(b => b.enabled).sort((a, b) => a.displayOrder - b.displayOrder);
      localStorage.setItem('titan_banner_cache', JSON.stringify(active));
      if (active.length > 0) {
        const img = new Image();
        img.src = active[0].imageUrl;
      }
      return active;
    }
    return cachedBanners;
  }, [homepageBanners, cachedBanners]);

  const [currentIndex, setCurrentIndex] = useState(0);`;

content = content.replace(anchor, replacement);
fs.writeFileSync('src/components/HomepageBannerSlider.tsx', content);
