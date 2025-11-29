const axios = require("axios");

class NewsAgent {
  constructor(sendLog) {
    this.name = "NewsAgent";
    this.sendLog = sendLog;
    this.articles = [];
    this.maxArticles = 30;
    this.fetchInterval = 10 * 60 * 1000; // 10 minutes
    this.apiKey = process.env.NEWS_API_KEY;
    this.lastFetchTime = null;
    this.isRunning = false;
  }

  async init() {
    if (!this.apiKey) {
      console.warn(
        `⚠️  [${this.name}] No NEWS_API_KEY found in environment. Agent will not fetch news.`
      );
      return;
    }

    console.log(
      `🗞️  [${this.name}] Initializing Disease & Outbreak News Intelligence...`
    );

    // Fetch immediately on startup
    await this.fetchNews();

    // Set up periodic fetching
    this.intervalId = setInterval(() => {
      this.fetchNews();
    }, this.fetchInterval);

    this.isRunning = true;
    console.log(
      `✅ [${this.name}] Running - will fetch news every ${
        this.fetchInterval / 60000
      } minutes`
    );
  }

  async fetchNews() {
    if (!this.apiKey) {
      return;
    }

    try {
      console.log(
        `📡 [${this.name}] Fetching latest health news from India...`
      );

      // Use search endpoint with India-specific disease keywords for better targeting
      const url = "https://gnews.io/api/v4/search";
      const params = {
        q: "India disease OR India outbreak OR India health OR Mumbai disease OR Delhi health OR Indian healthcare",
        lang: "en",
        country: "in",
        max: 30,
        sortby: "publishedAt",
        apikey: this.apiKey,
      };

      const response = await axios.get(url, {
        params,
        timeout: 10000, // 10 second timeout
      });

      if (
        response.data &&
        response.data.articles &&
        response.data.articles.length > 0
      ) {
        const rawArticles = response.data.articles;

        // Clean and extract only necessary fields
        const cleanArticles = rawArticles.map((article) => ({
          title: article.title || "Untitled",
          description: article.description || "",
          url: article.url || "",
          sourceName: article.source?.name || "Unknown Source",
          publishedAt: article.publishedAt || new Date().toISOString(),
        }));

        // Update in-memory store (keep latest articles)
        this.articles = cleanArticles.slice(0, this.maxArticles);
        this.lastFetchTime = new Date();

        // Log success message for UI
        const topHeadline =
          this.articles[0].title.substring(0, 80) +
          (this.articles[0].title.length > 80 ? "..." : "");
        const logMessage = `Fetched ${this.articles.length} new health articles (top headline: "${topHeadline}")`;

        console.log(`✅ [${this.name}] ${logMessage}`);

        if (this.sendLog) {
          this.sendLog({
            timestamp: this.lastFetchTime.toISOString(),
            agent: this.name,
            event: "NEWS_FETCHED",
            data: {
              count: this.articles.length,
              topHeadline: topHeadline,
            },
            message: logMessage,
          });
        }
      } else {
        console.warn(`⚠️  [${this.name}] No articles found in API response`);
      }
    } catch (error) {
      // Graceful error handling
      const errorMessage = error.response
        ? `API error (${error.response.status}): ${error.response.statusText}`
        : error.code === "ECONNABORTED"
        ? "Request timeout - API not responding"
        : error.message;

      console.error(`❌ [${this.name}] Error fetching news: ${errorMessage}`);

      if (this.sendLog) {
        this.sendLog({
          timestamp: new Date().toISOString(),
          agent: this.name,
          event: "NEWS_FETCH_ERROR",
          data: { error: errorMessage },
          message: `Failed to fetch news: ${errorMessage}`,
        });
      }

      // If this is the first fetch and it failed, populate with empty array
      if (this.articles.length === 0) {
        this.articles = [];
      }
    }
  }

  getArticles() {
    return {
      articles: this.articles,
      count: this.articles.length,
      lastFetchTime: this.lastFetchTime,
      nextFetchTime: this.lastFetchTime
        ? new Date(this.lastFetchTime.getTime() + this.fetchInterval)
        : null,
      status: this.isRunning ? "active" : "inactive",
    };
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log(`🛑 [${this.name}] Stopped`);
    }
  }
}

module.exports = NewsAgent;
