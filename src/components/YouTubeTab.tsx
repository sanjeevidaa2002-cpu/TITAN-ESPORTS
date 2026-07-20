/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Youtube, 
  Play, 
  Tv, 
  Users, 
  Video, 
  Flame, 
  Search, 
  SlidersHorizontal, 
  Eye, 
  Heart, 
  MessageSquare, 
  Calendar, 
  ExternalLink, 
  Clock, 
  AlertCircle, 
  Loader2,
  ChevronDown,
  Sparkles,
  Volume2
} from 'lucide-react';

let isFetchingYT = false;
let lastYtFetch = 0;
const CACHE_TTL = 1000 * 60 * 5;
const YT_CACHE_KEY = "titangaming_yt_cache";

interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  country: string;
  logo: string;
  banner: string;
  subscribers: number;
  views: number;
  videosCount: number;
}

interface VideoItem {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  views: number;
  likes: number;
  comments: number;
}

interface LiveStatus {
  isLive: boolean;
  activeLive: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
    viewerCount: number;
  } | null;
  upcomingStreams: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
  }[];
}

export const preloadYouTubeData = async () => {
  if (isFetchingYT) return;
  const cachedStr = localStorage.getItem(YT_CACHE_KEY);
  if (cachedStr && Date.now() - lastYtFetch < CACHE_TTL) return;

  isFetchingYT = true;
  try {
    const configRes = await fetch('/api/youtube/config');
    if (!configRes.ok) return;

    const configContentType = configRes.headers.get("content-type") || "";
    if (!configContentType.includes("application/json")) return;

    const configData = await configRes.json();
    
    if (!configData.enabled || !configData.hasApiKey || !configData.channelId) {
      isFetchingYT = false;
      return; 
    }

    const [channelRes, videosRes, shortsRes, liveRes] = await Promise.all([
      fetch('/api/youtube/channel'),
      fetch('/api/youtube/videos'),
      fetch('/api/youtube/shorts'),
      fetch('/api/youtube/live')
    ]);

    let newChannel = null;
    let newVideos = [];
    let newShorts = [];
    let newLive = null;

    if (channelRes.ok && (channelRes.headers.get("content-type") || "").includes("application/json")) {
      try { newChannel = await channelRes.json(); } catch (_) {}
    }
    if (videosRes.ok && (videosRes.headers.get("content-type") || "").includes("application/json")) {
      try { newVideos = await videosRes.json(); } catch (_) {}
    }
    if (shortsRes.ok && (shortsRes.headers.get("content-type") || "").includes("application/json")) {
      try { newShorts = await shortsRes.json(); } catch (_) {}
    }
    if (liveRes.ok && (liveRes.headers.get("content-type") || "").includes("application/json")) {
      try { newLive = await liveRes.json(); } catch (_) {}
    }

    localStorage.setItem(YT_CACHE_KEY, JSON.stringify({
      config: configData,
      channel: newChannel,
      videos: newVideos,
      shorts: newShorts,
      liveData: newLive
    }));
    
    lastYtFetch = Date.now();
  } catch (err) {
    console.warn("Error preloading YouTube metadata:", err);
  } finally {
    isFetchingYT = false;
  }
};

export const YouTubeTab: React.FC = () => {
  const [config, setConfig] = useState<{ enabled: boolean; hasApiKey: boolean; channelId: string } | null>(null);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [shorts, setShorts] = useState<VideoItem[]>([]);
  const [liveData, setLiveData] = useState<LiveStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'videos' | 'shorts' | 'live'>('videos');

  // Video Search & Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');

  // Interactive embed player state
  const [activeEmbedId, setActiveEmbedId] = useState<string | null>(null);

  // Pagination / Load more
  const [visibleVideosCount, setVisibleVideosCount] = useState(8);
  const [visibleShortsCount, setVisibleShortsCount] = useState(6);

  useEffect(() => {
    fetchYouTubeData();
  }, []);

    const fetchYouTubeData = async () => {
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
      
      const configContentType = configRes.headers.get("content-type") || "";
      if (!configContentType.includes("application/json")) {
        throw new Error("Unable to connect to the YouTube integration center. Please configure valid API credentials in the Admin Panel.");
      }

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

      let newChannel = null;
      let newVideos = [];
      let newShorts = [];
      let newLive = null;

      if (channelRes.ok && (channelRes.headers.get("content-type") || "").includes("application/json")) {
        try { newChannel = await channelRes.json(); } catch (_) {}
      }
      if (videosRes.ok && (videosRes.headers.get("content-type") || "").includes("application/json")) {
        try { newVideos = await videosRes.json(); } catch (_) {}
      }
      if (shortsRes.ok && (shortsRes.headers.get("content-type") || "").includes("application/json")) {
        try { newShorts = await shortsRes.json(); } catch (_) {}
      }
      if (liveRes.ok && (liveRes.headers.get("content-type") || "").includes("application/json")) {
        try { newLive = await liveRes.json(); } catch (_) {}
      }

      if (newChannel) setChannel(newChannel);
      if (newVideos && newVideos.length > 0) setVideos(newVideos);
      if (newShorts && newShorts.length > 0) setShorts(newShorts);
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
      console.warn("Error retrieving YouTube metadata:");
      if (!cachedStr) {
        setError(err.message || "An unexpected error occurred while fetching YouTube stream data.");
      }
    } finally {
      setLoading(false);
      isFetchingYT = false;
    }
  };

  // Helper formatting for subscribers and views count
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Helper to format video published times
  const formatPublishedAt = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffMonths / 12)} year${Math.floor(diffMonths / 12) > 1 ? 's' : ''} ago`;
  };

  // Helper to convert YT ISO duration "PT12M30S" to display format "12:30"
  const formatDuration = (durationStr: string) => {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '00:00';
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    const formattedSec = seconds < 10 ? `0${seconds}` : seconds;
    if (hours > 0) {
      const formattedMin = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${formattedMin}:${formattedSec}`;
    }
    return `${minutes}:${formattedSec}`;
  };

  // Filter and sort core video list
  const filteredVideos = videos
    .filter(video => {
      // Search term matching
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            video.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Duration filter matching
      if (filterDuration === 'short') return matchesSearch && video.durationSeconds < 240; // < 4 min
      if (filterDuration === 'medium') return matchesSearch && video.durationSeconds >= 240 && video.durationSeconds <= 900; // 4-15 min
      if (filterDuration === 'long') return matchesSearch && video.durationSeconds > 900; // > 15 min

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'oldest') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(); // default: latest
    });

  const filteredShorts = shorts.filter(short => 
    short.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <Loader2 className="w-10 h-10 text-gold-400 animate-spin mb-4" />
        <p className="text-sm text-neutral-400 font-mono">Syncing live feed directly from YouTube channel...</p>
      </div>
    );
  }

  // Integration not configured fallback UI
  if (!config?.enabled || !config?.hasApiKey || !config?.channelId) {
    return (
      <div className="space-y-6 pb-24">
        {/* Header Block */}
        <div className="bg-[#111116]/80 p-5 rounded-2xl border border-white/5 backdrop-blur-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
            <Youtube className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-white">Titan Stream</h2>
            <p className="text-[10px] text-neutral-400 font-mono">Real-time Gaming Channels</p>
          </div>
        </div>

        {/* Informative placeholder card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#0a0a0f] to-neutral-900/60 p-8 border border-indigo-500/10 text-center space-y-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
            <Tv className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black tracking-wider text-white uppercase italic">INTEGRATION IN TRANSIT 🚀</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Our esports administrative officers are preparing exclusive live streams, tournament highlights, Clash Squad strategies, and pro gameplay tutorials.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-[11px] text-amber-400 font-mono inline-block max-w-sm">
            🛡️ Administrative Note: Open the <span className="font-bold underline text-white">Admin Panel</span> and select "YouTube Management" to save your Channel credentials & launch the broadcast.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      
      {/* 1. CHANNEL BRANDING HEADER */}
      {channel && (
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0f0f15] shadow-2xl">
          {/* Banner background (External or fallback default graphic) */}
          <div 
            className="h-28 md:h-36 w-full bg-cover bg-center relative"
            style={{ 
              backgroundImage: channel.banner 
                ? `url(${channel.banner})` 
                : `linear-gradient(to right, #111, #800f2f, #1a0b2e)` 
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-transparent to-black/30" />
            
            {/* Live broadcast status floating badge */}
            {liveData?.isLive && (
              <div className="absolute top-3 right-3 animate-bounce px-2.5 py-1 rounded-full bg-red-600 text-white text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>LIVE STREAMING</span>
              </div>
            )}
          </div>

          {/* Profile details overlay */}
          <div className="px-5 pb-5 -mt-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <img 
                src={channel.logo} 
                alt={channel.title} 
                className="w-20 h-20 rounded-2xl border-4 border-[#0f0f15] bg-neutral-800 object-cover shadow-xl shrink-0"
              />

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-white tracking-wide uppercase">{channel.title}</h1>
                  <span className="p-1 rounded-md bg-gold-500/10 text-gold-400 border border-gold-500/20 text-[9px] font-mono tracking-wider uppercase">VERIFIED</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-mono tracking-wide">
                  {channel.customUrl || `@${channel.title.toLowerCase().replace(/\s/g, '')}`} • {formatNumber(channel.subscribers)} subscribers
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <a 
                  href={`https://youtube.com/channel/${channel.id}?sub_confirmation=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] tracking-widest uppercase rounded-xl transition-all cursor-pointer shadow-[0_4px_15px_rgba(220,38,38,0.3)] flex items-center gap-1.5"
                >
                  <Youtube className="w-4 h-4 fill-white" />
                  Subscribe
                </a>
                <a 
                  href={`https://youtube.com/channel/${channel.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Visit YouTube Channel"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Expandable Channel Description */}
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans mt-4 border-t border-white/5 pt-3 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
              {channel.description || 'Welcome to our official Free Fire tournament channel! Live coverage, highlights, tournament finals and esports match playups.'}
            </p>

            {/* Quick Stats bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 border-t border-white/5 pt-3">
              <div className="bg-[#14141d] p-2.5 rounded-xl text-center border border-white/5">
                <span className="block text-xs font-black text-white font-mono">{formatNumber(channel.views)}</span>
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Total Views</span>
              </div>
              <div className="bg-[#14141d] p-2.5 rounded-xl text-center border border-white/5">
                <span className="block text-xs font-black text-white font-mono">{channel.videosCount}</span>
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Total Videos</span>
              </div>
              <div className="bg-[#14141d] p-2.5 rounded-xl text-center border border-white/5">
                <span className="block text-xs font-black text-gold-400 font-mono">{formatNumber(channel.subscribers)}</span>
                <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Gamers Community</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB TOGGLE NAVIGATION */}
      <div className="flex bg-[#0d0d12] p-1.5 rounded-2xl border border-white/5">
        <button 
          onClick={() => { setActiveSubTab('videos'); setActiveEmbedId(null); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeSubTab === 'videos' ? 'bg-gradient-to-r from-amber-500 to-gold-500 text-neutral-950 shadow-lg' : 'text-neutral-400 hover:text-white'}`}
        >
          <Video className="w-4 h-4" />
          Videos
        </button>
        <button 
          onClick={() => { setActiveSubTab('shorts'); setActiveEmbedId(null); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeSubTab === 'shorts' ? 'bg-gradient-to-r from-amber-500 to-gold-500 text-neutral-950 shadow-lg' : 'text-neutral-400 hover:text-white'}`}
        >
          <Flame className="w-4 h-4" />
          Shorts
        </button>
        <button 
          onClick={() => { setActiveSubTab('live'); setActiveEmbedId(null); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeSubTab === 'live' ? 'bg-gradient-to-r from-amber-500 to-gold-500 text-neutral-950 shadow-lg' : 'text-neutral-400 hover:text-white'}`}
        >
          <Tv className="w-4 h-4" />
          Live Tab
          {liveData?.isLive && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
          )}
        </button>
      </div>

      {/* 3. DYNAMIC CONTENT RENDERING */}
      {activeSubTab === 'videos' && (
        <div className="space-y-4">
          
          {/* Search, Sort, Filters Bar */}
          <div className="bg-[#111116] p-4 rounded-2xl border border-white/5 space-y-3">
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournament video highlights..."
                className="w-full bg-[#08080c] text-xs text-white border border-white/10 rounded-xl py-3 pl-10 pr-4 placeholder-neutral-500 focus:outline-none focus:border-gold-500/50 transition-all font-mono"
              />
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Sort selector */}
              <div className="flex-1 flex items-center gap-2 bg-[#08080c] px-3 py-2.5 rounded-xl border border-white/5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs text-neutral-300 font-mono w-full focus:outline-none"
                >
                  <option value="latest" className="bg-[#0c0c11]">Latest Broadcasts</option>
                  <option value="popular" className="bg-[#0c0c11]">Most Viewed</option>
                  <option value="oldest" className="bg-[#0c0c11]">Oldest Uploads</option>
                </select>
              </div>

              {/* Duration filters */}
              <div className="flex-1 flex items-center gap-2 bg-[#08080c] px-3 py-2.5 rounded-xl border border-white/5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <select 
                  value={filterDuration}
                  onChange={(e: any) => setFilterDuration(e.target.value)}
                  className="bg-transparent text-xs text-neutral-300 font-mono w-full focus:outline-none"
                >
                  <option value="all" className="bg-[#0c0c11]">Any Duration</option>
                  <option value="short" className="bg-[#0c0c11]">Short clips (&lt; 4 min)</option>
                  <option value="medium" className="bg-[#0c0c11]">Medium matches (4-15 min)</option>
                  <option value="long" className="bg-[#0c0c11]">Esports matches (&gt; 15 min)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          {filteredVideos.length === 0 ? (
            <div className="bg-[#111116] p-10 rounded-2xl border border-white/5 text-center text-neutral-400 font-mono text-xs">
              <AlertCircle className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
              No matches video uploads found fitting your filter parameters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVideos.slice(0, visibleVideosCount).map(video => (
                <div key={video.id} className="bg-[#111116] border border-white/5 rounded-2xl overflow-hidden hover:border-gold-500/20 hover:shadow-lg transition-all flex flex-col group">
                  
                  {/* Thumbnail / Embedded Player */}
                  <div className="aspect-video relative overflow-hidden bg-black shrink-0">
                    {activeEmbedId === video.id ? (
                      <iframe 
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1`} 
                        title={video.title}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          loading="lazy"
                        />
                        {/* Semi-transparent dark overlay */}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <button 
                            onClick={() => setActiveEmbedId(video.id)}
                            className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg group-hover:bg-red-700"
                          >
                            <Play className="w-5 h-5 fill-white" />
                          </button>
                        </div>
                        {/* Floating duration label */}
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono font-black text-white">
                          {formatDuration(video.duration)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Description Box */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 
                        onClick={() => setActiveEmbedId(video.id)}
                        className="text-xs font-bold text-neutral-100 uppercase tracking-wide group-hover:text-gold-400 transition-colors line-clamp-2 cursor-pointer"
                      >
                        {video.title}
                      </h3>
                      <p className="text-[10px] text-neutral-400 line-clamp-2 font-sans">
                        {video.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] font-mono text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatNumber(video.views)} views</span>
                      </div>
                      <span>{formatPublishedAt(video.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more button */}
          {filteredVideos.length > visibleVideosCount && (
            <button 
              onClick={() => setVisibleVideosCount(prev => prev + 6)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-neutral-300 font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              Load More Broadcasts <ChevronDown className="w-4 h-4" />
            </button>
          )}

        </div>
      )}

      {activeSubTab === 'shorts' && (
        <div className="space-y-4">
          {filteredShorts.length === 0 ? (
            <div className="bg-[#111116] p-10 rounded-2xl border border-white/5 text-center text-neutral-400 font-mono text-xs">
              <AlertCircle className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
              No YouTube Shorts found on this channel.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredShorts.slice(0, visibleShortsCount).map(short => (
                <div key={short.id} className="bg-[#111116] border border-white/5 rounded-2xl overflow-hidden hover:border-gold-500/20 hover:shadow-lg transition-all flex flex-col group relative">
                  
                  {/* Vertical Shorts Aspect ratio */}
                  <div className="aspect-[9/16] bg-black relative overflow-hidden shrink-0">
                    {activeEmbedId === short.id ? (
                      <iframe 
                        src={`https://www.youtube.com/embed/${short.id}?autoplay=1&loop=1`} 
                        title={short.title}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                      />
                    ) : (
                      <>
                        <img 
                          src={short.thumbnail} 
                          alt={short.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/35 flex flex-col justify-between p-3.5">
                          {/* Top Red Shorts Badge */}
                          <div className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[8px] tracking-widest uppercase w-max flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 animate-pulse" /> Shorts
                          </div>

                          {/* Play center trigger */}
                          <button 
                            onClick={() => setActiveEmbedId(short.id)}
                            className="mx-auto w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg group-hover:bg-red-700"
                          >
                            <Play className="w-4.5 h-4.5 fill-white" />
                          </button>

                          {/* Overlay statistics */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-white uppercase line-clamp-2 tracking-wide leading-tight group-hover:text-gold-400 transition-colors">
                              {short.title}
                            </p>
                            <div className="flex items-center justify-between text-[8px] font-mono text-neutral-300 border-t border-white/10 pt-1.5">
                              <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{formatNumber(short.views)}</span>
                              <span>{formatPublishedAt(short.publishedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Load more shorts */}
          {filteredShorts.length > visibleShortsCount && (
            <button 
              onClick={() => setVisibleShortsCount(prev => prev + 6)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-neutral-300 font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              Load More Shorts <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {activeSubTab === 'live' && (
        <div className="space-y-6">
          
          {/* Active Live Broadcaster */}
          {liveData?.isLive && liveData.activeLive ? (
            <div className="bg-[#111116] border border-red-500/20 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-red-600 text-white text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE TOURNAMENT COVERAGE
              </div>

              {/* Embed Screen player */}
              <div className="aspect-video w-full bg-black relative">
                <iframe 
                  src={`https://www.youtube.com/embed/${liveData.activeLive.id}?autoplay=1`} 
                  title={liveData.activeLive.title}
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                />
              </div>

              {/* Stream Title and Metrics */}
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
                    {liveData.activeLive.title}
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    {liveData.activeLive.description || 'Welcome to the Live stream! Support our pro Free Fire squads as they fight for the title.'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3.5 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-red-500 font-bold bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/10">
                    <Users className="w-4 h-4 animate-pulse" />
                    <span>{liveData.activeLive.viewerCount} Viewers</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Began: {formatPublishedAt(liveData.activeLive.publishedAt)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111116] border border-white/5 rounded-3xl p-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 mx-auto">
                <Tv className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white uppercase">No Active Live Stream</h4>
                <p className="text-[11px] text-neutral-400 font-sans max-w-sm mx-auto leading-relaxed">
                  We are not live at the moment. View our latest Uploaded matches highlights and gameplay clips in the Videos and Shorts tab!
                </p>
              </div>
            </div>
          )}

          {/* 3B. UPCOMING / SCHEDULED STREAMS SECTION */}
          {liveData?.upcomingStreams && liveData.upcomingStreams.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-400 animate-pulse" />
                <h3 className="text-[10px] uppercase font-black tracking-widest text-neutral-300">Upcoming Broadcasts & Streams</h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {liveData.upcomingStreams.map(stream => (
                  <div key={stream.id} className="bg-[#111116] border border-white/5 rounded-2xl p-3 flex gap-3 hover:border-gold-500/20 transition-all group">
                    <img 
                      src={stream.thumbnail} 
                      alt={stream.title} 
                      className="w-24 aspect-video rounded-lg object-cover shrink-0 bg-neutral-800"
                      loading="lazy"
                    />
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wide group-hover:text-gold-400 transition-colors line-clamp-1">
                          {stream.title}
                        </h4>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 font-sans">
                          {stream.description || 'Upcoming Esports tournament live coverage.'}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-[9px] font-mono text-gold-400 font-bold">
                        <span>Scheduled: {new Date(stream.publishedAt).toLocaleString()}</span>
                        <a 
                          href={`https://youtube.com/watch?v=${stream.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-0.5 hover:underline"
                        >
                          Set Reminder <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
