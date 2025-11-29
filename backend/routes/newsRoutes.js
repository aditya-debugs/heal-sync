const express = require("express");
const router = express.Router();

let newsAgentInstance = null;

/**
 * Initialize the news routes with the NewsAgent instance
 */
function initNewsRoutes(newsAgent) {
  newsAgentInstance = newsAgent;
  return router;
}

/**
 * GET /api/news/health
 * Returns the latest health news articles from the in-memory store
 */
router.get("/health", (req, res) => {
  try {
    if (!newsAgentInstance) {
      return res.status(503).json({
        success: false,
        message: "News service not initialized",
        articles: [],
        count: 0,
      });
    }

    const newsData = newsAgentInstance.getArticles();

    res.json({
      success: true,
      ...newsData,
    });
  } catch (error) {
    console.error("Error in /api/news/health:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve news articles",
      error: error.message,
      articles: [],
      count: 0,
    });
  }
});

module.exports = { initNewsRoutes };
