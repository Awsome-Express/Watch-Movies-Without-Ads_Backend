var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/xemphim', async (req, res, next) => {
  const keyword = req.query.keyword
  let  videos = []
  if(keyword) {
    videos = await require('../crawls/cheerio').run(keyword)
  }
  res.send(videos)
});
module.exports = router;
