'use strict';

exports.login = function(req, res) {
  if (req.user) return res.render('hooray', { user: req.user });
  return res.render('login');
};