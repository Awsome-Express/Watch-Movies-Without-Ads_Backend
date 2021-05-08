var express = require('express');
var router = express.Router();
const Crawler = require('../crawls/index')
/* GET home page. */
router.get('/xemphim', async (req, res, next) => {
  const keyword = req.query.keyword
  let  urls = []
  if(keyword) {
    urls = await Crawler.run(keyword)
  }
  res.render('index', { urls: urls });
});

router.get('/view', async (req, res, next) => {
  const link = req.query.link
  res.render('view', { link: link });
});

module.exports = router;
