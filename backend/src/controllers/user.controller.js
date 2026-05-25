const userService = require('../services/user.service');

const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile };
