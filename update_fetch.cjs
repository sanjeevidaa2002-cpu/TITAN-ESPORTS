const fs = require('fs');
const content = fs.readFileSync('src/components/YouTubeTab.tsx', 'utf8');

const newFetchFn = `  const fetchYouTubeData = async () => {
    const cachedStr = localStorage.getItem(YT_CACHE_KEY);
    if (cachedStr) {
      try {
        const cache = JSON.parse(cachedStr);
        if (cache.config) setConfig(cache.config);
        if (cache.channel) setChannel(cache.channel);
        if (cache.videos) setVideos(cache.videos);
        if (cache.shorts) setShorts(cache.shorts);
        if (cache.liveData) setLiveData(cache.liveData);
        setLoading(false);
      } catch (e) {
        console.warn("Failed to parse YT cache");
      }
    } else {
      setLoading(true);
    }

    if (isFetchingYT) return;
    
    if (cachedStr && Date.now() - lastYtFetch < CACHE_TTL) {
      return; 
    }

    isFetchingYT = true;
    if (!cachedStr) setError(null);

    try {
      const configRes = await fetch('/api/youtube/config');
      if (!configRes.ok) throw new Error("Failed to load YouTube setup configuration");
      const configData = await configRes.json();
      
      setConfig(configData);

      if (!configData.enabled || !configData.hasApiKey || !configData.channelId) {
        setLoading(false);
        isFetchingYT = false;
        return; 
      }

      const [channelRes, videosRes, shortsRes, liveRes] = await Promise.all([
        fetch('/api/youtube/channel'),
        fetch('/api/youtube/videos'),
        fetch('/api/youtube/shorts'),
        fetch('/api/youtube/live')
      ]);

      const newChannel = channelRes.ok ? await channelRes.json() : null;
      const newVideos = videosRes.ok ? await videosRes.json() : [];
      const newShorts = shortsRes.ok ? await shortsRes.json() : [];
      const newLive = liveRes.ok ? await liveRes.json() : null;

      if (newChannel) setChannel(newChannel);
      if (newVideos) setVideos(newVideos);
      if (newShorts) setShorts(newShorts);
      if (newLive) setLiveData(newLive);

      localStorage.setItem(YT_CACHE_KEY, JSON.stringify({
        config: configData,
        channel: newChannel,
        videos: newVideos,
        shorts: newShorts,
        liveData: newLive
      }));
      
      lastYtFetch = Date.now();

    } catch (err: any) {
      console.warn("Error retrieving YouTube metadata:", err);
      if (!cachedStr) {
        setError(err.message || "An unexpected error occurred while fetching YouTube stream data.");
      }
    } finally {
      setLoading(false);
      isFetchingYT = false;
    }
  };`;

// replace old fetchYouTubeData
const startIndex = content.indexOf('const fetchYouTubeData = async () => {');
const endIndex = content.indexOf('  // Helper formatting for subscribers and views count');

if (startIndex === -1 || endIndex === -1) {
  console.log('Error: Could not find markers');
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + newFetchFn + '\n\n' + content.substring(endIndex);
fs.writeFileSync('src/components/YouTubeTab.tsx', newContent);
console.log('Successfully updated fetchYouTubeData');
