const { Activity } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../models');

// Weekly chart — last 7 days distance per day
const getWeeklyChart = async (userId) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const results = await Activity.findAll({
    where: {
      user_id: userId,
      created_at: { [Op.gte]: new Date(days[0]) },
    },
    attributes: [
      [fn('DATE', col('created_at')), 'date'],
      [fn('SUM', col('distance')), 'total'],
    ],
    group: [literal('DATE(created_at)')],
  });

  const map = {};
  results.forEach(r => { map[r.dataValues.date] = parseFloat(r.dataValues.total); });

  return days.map(d => ({
    date: d,
    label: new Date(d).toLocaleDateString('id-ID', { weekday: 'short' }),
    distance: map[d] || 0,
  }));
};

// Streak — consecutive days with activity
const getStreak = async (userId) => {
  const activities = await Activity.findAll({
    where: { user_id: userId },
    attributes: [[fn('DATE', col('created_at')), 'date']],
    group: [literal('DATE(created_at)')],
    order: [[literal('DATE(created_at)'), 'DESC']],
  });

  const dates = activities.map(a => a.dataValues.date);
  if (!dates.length) return { current: 0, longest: 0 };

  let current = 0;
  let longest = 0;
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Current streak
  let check = dates[0] === today || dates[0] === yesterday ? dates[0] : null;
  if (check) {
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(check);
      expected.setDate(expected.getDate() - i);
      const exp = expected.toISOString().split('T')[0];
      if (dates[i] === exp) { current++; } else break;
    }
  }

  // Longest streak
  streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev - curr) / 86400000;
    if (diff === 1) { streak++; longest = Math.max(longest, streak); }
    else { streak = 1; }
  }
  longest = Math.max(longest, current, streak);

  return { current, longest };
};

// Achievements
const getAchievements = async (userId) => {
  const result = await Activity.findOne({
    where: { user_id: userId },
    attributes: [
      [fn('SUM', col('distance')), 'total_distance'],
      [fn('COUNT', col('id')), 'total_runs'],
      [fn('MAX', col('distance')), 'max_distance'],
    ],
  });

  const totalDist = parseFloat(result?.dataValues?.total_distance || 0);
  const totalRuns = parseInt(result?.dataValues?.total_runs || 0);
  const maxDist = parseFloat(result?.dataValues?.max_distance || 0);
  const streak = await getStreak(userId);

  const all = [
    // Pemula
    { id: 'first_run',    icon: '👟', title: 'Rekrut Baru',        desc: 'Selesaikan latihan lari pertama',              unlocked: totalRuns >= 1,    category: 'Pemula' },
    { id: 'run_5',        icon: '🎽', title: 'Calon Prajurit',     desc: 'Latihan sebanyak 5 kali',                      unlocked: totalRuns >= 5,    category: 'Pemula' },
    { id: 'run_10',       icon: '💪', title: 'Prajurit Aktif',     desc: 'Latihan sebanyak 10 kali',                     unlocked: totalRuns >= 10,   category: 'Pemula' },

    // Kesamaptaan Jasmani
    { id: 'samapta_2400', icon: '🏃', title: 'Lulus Samapta 2.4K', desc: 'Selesaikan lari 2.4 km dalam satu sesi',       unlocked: maxDist >= 2.4,   category: 'Kesamaptaan' },
    { id: 'samapta_3200', icon: '⚡', title: 'Samapta 3.2K',       desc: 'Selesaikan lari 3.2 km dalam satu sesi',       unlocked: maxDist >= 3.2,   category: 'Kesamaptaan' },
    { id: 'samapta_5000', icon: '🔥', title: 'Samapta 5K',         desc: 'Selesaikan lari 5 km dalam satu sesi',         unlocked: maxDist >= 5,     category: 'Kesamaptaan' },
    { id: 'samapta_10k',  icon: '🎯', title: 'Samapta 10K',        desc: 'Selesaikan lari 10 km dalam satu sesi',        unlocked: maxDist >= 10,    category: 'Kesamaptaan' },

    // Total Jarak
    { id: 'dist_10',      icon: '🌟', title: 'Jarak 10 KM',        desc: 'Akumulasi total jarak 10 km',                  unlocked: totalDist >= 10,  category: 'Jarak' },
    { id: 'dist_50',      icon: '🏅', title: 'Jarak 50 KM',        desc: 'Akumulasi total jarak 50 km',                  unlocked: totalDist >= 50,  category: 'Jarak' },
    { id: 'dist_100',     icon: '🏆', title: 'Jarak 100 KM',       desc: 'Akumulasi total jarak 100 km',                 unlocked: totalDist >= 100, category: 'Jarak' },

    // Konsistensi
    { id: 'streak_3',     icon: '📅', title: 'Disiplin 3 Hari',    desc: 'Latihan 3 hari berturut-turut',                unlocked: streak.longest >= 3,  category: 'Disiplin' },
    { id: 'streak_7',     icon: '🗓️', title: 'Seminggu Penuh',     desc: 'Latihan 7 hari berturut-turut',                unlocked: streak.longest >= 7,  category: 'Disiplin' },
    { id: 'streak_30',    icon: '💎', title: 'Prajurit Sejati',     desc: 'Latihan 30 hari berturut-turut',               unlocked: streak.longest >= 30, category: 'Disiplin' },
  ];

  return all;
};

module.exports = { getWeeklyChart, getStreak, getAchievements };
