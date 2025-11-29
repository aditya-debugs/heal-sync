import React, { useState, useEffect } from "react";

const HealthNewsSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 10 * 60 * 1000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
    try {
      console.log("🔄 Fetching health news...");
      const response = await fetch("http://localhost:4000/api/news/health");
      const data = await response.json();
      console.log("📰 News API Response:", data);
      if (data.success && data.articles) {
        setArticles(data.articles);
        setLastFetchTime(data.lastFetchTime);
        console.log(`✅ Loaded ${data.articles.length} articles`);
      } else {
        console.warn("⚠️ No articles in response or API failed");
      }
    } catch (error) {
      console.error("❌ Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const NewsCard = ({ article, isCompact = false }) => {
    const isRecent =
      new Date() - new Date(article.publishedAt) < 24 * 60 * 60 * 1000;

    return (
      <div className="group relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-xl p-5 border-2 border-slate-700 hover:border-blue-500 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02] overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-cyan-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Breaking news badge */}
        {isRecent && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
            BREAKING
          </div>
        )}

        <div className="relative z-10">
          {/* Header with icon */}
          <div className="flex items-start gap-4 mb-3">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              🏥
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white mb-1 line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full font-medium border border-blue-500/30">
                  {article.sourceName}
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formatTimeAgo(article.publishedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {!isCompact && (
            <p className="text-sm text-slate-300 mb-4 line-clamp-3 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Divider line */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-3"></div>

          {/* Read more button */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-sm font-semibold text-blue-400 hover:text-blue-300 transition-all group/link"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 group-hover/link:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Read Full Story
            </span>
            <svg
              className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>

        {/* Corner accent */}
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-600/10 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const displayedArticles = articles.slice(0, 4);

  return (
    <>
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 relative z-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              🗞️ Latest Health News
            </h2>
            {lastFetchTime && (
              <span className="text-xs text-slate-500">
                Updated {formatTimeAgo(lastFetchTime)}
              </span>
            )}
          </div>
          {articles.length > 4 && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-blue-500/50"
            >
              View All {articles.length} News →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedArticles.map((article, index) => (
            <NewsCard key={index} article={article} />
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No health news available at the moment
          </div>
        )}
      </div>

      {/* Modal for all articles */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-slate-900 rounded-xl border-2 border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📰 All Health News Articles
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {articles.length} latest updates from trusted sources
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div
              className="overflow-y-auto p-6"
              style={{ maxHeight: "calc(90vh - 120px)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((article, index) => (
                  <NewsCard key={index} article={article} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HealthNewsSection;
