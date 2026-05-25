const leaderboardService = require('../services/leaderboard.service');

const getLeaderboard = async (req, res, next) => {
  try {
    const data = await leaderboardService.getLeaderboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard };
