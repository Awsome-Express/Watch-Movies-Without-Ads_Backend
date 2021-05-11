const got = require('got');
const cheerio = require('cheerio');
const axios = require('axios');

const run = async (keyword) => {
  try {
    const m3u8Urls = []

    const keywordRemoveAccents = removeAccents(keyword)
    const isMovieInKeyword = keywordRemoveAccents.indexOf('tap') !== -1 ? false : true
    console.log(keywordRemoveAccents);
    let episode = ''
    if(!isMovieInKeyword) {
      keyword = keywordRemoveAccents.split('tap')[0]
      episode = keywordRemoveAccents.split('tap')[1].trim()
      console.log(episode);
      episode = episode === '' ? 1 : episode
    }
    const phePhimRes = await got(`https://phephimz.net/tim-kiem?q=${keyword}`);
    const $ = cheerio.load(phePhimRes.body);
    const videos = []
    $("#slide-episodes").find('> div.col-xs-6').map((i, element) => {
      const url = $(element).find('a.film-title').attr('href')
      const title = $(element).find('a.film-title').text()
      const subtext = $(element).find('div.film-tag .sub').text()
      const isMovie = removeAccents(subtext).indexOf('tap') !== -1 ? false : true
      let thumbnail = $(element)
      .find('a.film-cover > .poster')
      .css('background-image');

      if (thumbnail) {
        thumbnail = thumbnail.replace(/^url\(["']?/, '').replace(/["']?\)$/, '')
      }
      videos.push({
        url,
        title,
        isMovie,
        thumbnail
      })
    })


    if(!isMovieInKeyword) {
      console.log('series');
      const videoSeries = [...videos].filter(video => !video.isMovie)
      await Promise.all(
        videoSeries.map(async (video) => {
          const m3u8Url = await getM3u8Url(video, episode)
          m3u8Url && m3u8Urls.push({
            title: video.title,
            url: m3u8Url,
            thumbnail: video.thumbnail,
            episode: episode
          })
        })
      )
    }

    // get movie
    if(isMovieInKeyword) {
      await Promise.all(
        videos.map(async (video) => {
          let episode = null
          if(!video.isMovie) {
            episode = 1
          }
          const m3u8Url = await getM3u8Url(video, episode)
          m3u8Url && m3u8Urls.push({
            title: video.title,
            url: m3u8Url,
            thumbnail: video.thumbnail,
            episode: episode
          })
        })
      )
    }
    console.log(m3u8Urls);
    return m3u8Urls
    
	} catch (error) {
		console.log(error);
    return []
	}
}

const getM3u8Url = async (video, episode) => {
  const prefixEndPoint = episode  ? `tap-${episode}.html` : 'xem-phim.html' 
  console.log(prefixEndPoint);
  const urlDetail = await got(`${video.url}/${prefixEndPoint}`);
  const idVideo = Number(urlDetail.body.match(/var EpisodeID = (.*);/)[1])
  console.log(idVideo);
  return await initPlayer(`https://phephim.xyz/embed/video?id=${idVideo}`)
}

async function initPlayer(url) {
  const { protocol, host, search } = new URL(url)
  if (!/id=(\d+)/.test(search)) return handleShowError(0, 'Không tìm thấy id của video.')
  vid = search.match(/id=(\d+)/)[1]
  const vinfo = protocol + '//' + host + '/api/getvinfo?callback=json&vid=' + vid
  const video = await fetchApi(vinfo)
  if(!video || video?.code !==0) return
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

const hasNumber = (myString) => {
  return /\d/.test(myString);
}

const removeAccents = (str) => {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase();
}
module.exports = {
  run: run
}