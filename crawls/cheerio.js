const got = require('got');
const cheerio = require('cheerio');
const axios = require('axios');

const run = async (keyword) => {
  try {
    const m3u8Urls = []
    if(!hasNumber(keyword)) keyword = keyword + 'Tập 1'

    function hasNumber(myString) {
      return /\d/.test(myString);
    }
    const googleResult = await got(`https://www.google.com/search?q=Phim ${keyword}`);
    const $ = cheerio.load(googleResult.body);
    const urls = []
    $("div a").each(function() {
      var link = $(this);
      var text = link.attr('href');

      urls.push(text.split('/url?q=')[1])
    });
    const urPhePhim = urls.filter(item => item !== undefined && new URL(item).origin.includes('phephimz.net'))[0]
    console.log(urPhePhim);
		const urlDetail = await got(urPhePhim.split('&')[0]);
		const idVideo = String(urlDetail.body).split('var EpisodeID = ')[1].split(' ')[0].match(/\d+/)[0]
    console.log(idVideo)
    const m3u8Url = await initPlayer(`https://phephim.xyz/embed/video?id=${idVideo}`)
    console.log(m3u8Url);
    m3u8Urls.push(m3u8Url)
    return m3u8Urls
    // const $ = cheerio.load(urlDetail.body);
	} catch (error) {
		console.log(error);
    return []
		//=> 'Internal server error ...'
	}
}
async function initPlayer(url) {
  const { protocol, host, search } = new URL(url)
  if (!/id=(\d+)/.test(search)) return handleShowError(0, 'Không tìm thấy id của video.')
  vid = search.match(/id=(\d+)/)[1]
  const vinfo = protocol + '//' + host + '/api/getvinfo?callback=json&vid=' + vid
  const video = await fetchApi(vinfo)
  if(!video) return
  const m3u8Url = video.data.host + '/vod/v2/packaged:mp4/' + video.data.mid + '/playlist.m3u8'

  return m3u8Url
}

const fetchApi = async (url) => {
  try {
      const config = {
          method: 'get',
          url: url,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
      };
      
      const response = await axios(config)
      return response.data
  } catch (error) {
      return null
  }
}


module.exports = {
  run: run
}