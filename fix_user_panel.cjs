const fs = require('fs');
let content = fs.readFileSync('src/components/MatchesTab.tsx', 'utf8');

// Add state for FF category
content = content.replace(
  /const \[selectedCategory, setSelectedCategory\] = useState<string>\('all'\);/,
  `const [selectedCategory, setSelectedCategory] = useState<string>('all');\n  const [ffCategoryFilter, setFfCategoryFilter] = useState<'all' | 'BR' | 'CS'>('BR');`
);

// Add filtering logic
const originalFilterEnd = `// Category Filter
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const activeCat = categories?.find(c => c.id === selectedCategory);
      if (activeCat) {
        const catNameLower = activeCat.name.toLowerCase();
        if (catNameLower.includes('free tournament') || activeCat.id === 'free_tournaments') {
          // Display tournaments from ALL games where Entry Fee = 0
          matchesCategory = (t.entryFee === 0 || t.isFreeMatch);
        } else {
          // Match specific game category (e.g. Free Fire, PUBG Mobile, Clash of Clans)
          // Default mock matches to 'free_fire' if gameCategory is not defined
          const tournamentCategory = t.gameCategory || 'free_fire';
          matchesCategory = (tournamentCategory.toLowerCase() === activeCat.id.toLowerCase() || 
                             tournamentCategory.toLowerCase() === activeCat.name.toLowerCase() ||
                             (activeCat.id === 'free_fire' && !t.gameCategory)); // fallback for old tournaments
        }
      }
    }

    return matchesSearch && matchesStatus && matchesMode && matchesFee && matchesCategory;
  });`;

const newFilterEnd = `// Category Filter
    let matchesCategory = true;
    let isFreeFire = false;
    if (selectedCategory !== 'all') {
      const activeCat = categories?.find(c => c.id === selectedCategory);
      if (activeCat) {
        const catNameLower = activeCat.name.toLowerCase();
        if (catNameLower.includes('free fire') || activeCat.id === 'free_fire') {
            isFreeFire = true;
        }
        if (catNameLower.includes('free tournament') || activeCat.id === 'free_tournaments') {
          // Display tournaments from ALL games where Entry Fee = 0
          matchesCategory = (t.entryFee === 0 || t.isFreeMatch);
        } else {
          // Match specific game category
          const tournamentCategory = t.gameCategory || 'free_fire';
          matchesCategory = (tournamentCategory.toLowerCase() === activeCat.id.toLowerCase() || 
                             tournamentCategory.toLowerCase() === activeCat.name.toLowerCase() ||
                             (activeCat.id === 'free_fire' && !t.gameCategory)); // fallback for old tournaments
        }
      }
    } else {
       // if all is selected, we might want to check if it's FF to apply FF filters, but usually if 'all' is selected we show everything.
    }

    let matchesFfCategory = true;
    if (matchesCategory && (isFreeFire || selectedCategory === 'all')) {
        // Only apply if it's actually a Free Fire tournament
        const isActuallyFf = (t.gameCategory || 'free_fire').toLowerCase().includes('free fire') || (t.gameCategory || 'free_fire').toLowerCase() === 'free_fire';
        if (isActuallyFf && ffCategoryFilter !== 'all') {
            // t.matchCategory should match ffCategoryFilter
            matchesFfCategory = (t.matchCategory === ffCategoryFilter) || (!t.matchCategory && ffCategoryFilter === 'BR'); // Default old to BR
        }
    }

    return matchesSearch && matchesStatus && matchesMode && matchesFee && matchesCategory && matchesFfCategory;
  });`;

content = content.replace(originalFilterEnd, newFilterEnd);

fs.writeFileSync('src/components/MatchesTab.tsx', content);
