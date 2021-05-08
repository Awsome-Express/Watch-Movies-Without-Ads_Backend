const puppeteer = require('puppeteer-extra');
const axios = require('axios');
let m3u8Urls = []
const run = async (keyword) => {
  m3u8Urls = []
  const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')

  puppeteer.use(AdblockerPlugin())
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()

  await page.goto('https://www.google.com/', { waitUntil: 'networkidle2', timeout: 0 })
  console.log(keyword);
  await page.type('input[class="gLFyf gsfi"]', `phim ${keyword}`)
  await page.keyboard.press('Enter')
  await page.waitForNavigation()
  const urlsByGoogle = await page.evaluate(() => {
      const urls = []

      const $URLS = [...document.querySelectorAll('.yuRUbf > a')]
      const origins = $URLS.map(item => new URL(item).origin)
      const hrefs = $URLS.map(item => item.href)

      const DOMAIN_ALLOW = ['phephimz.net']
      DOMAIN_ALLOW.forEach(item => {
          const index = origins.findIndex(origin => origin.includes(item))
          if(index !== -1) urls.push({
              href: hrefs[index],
              id: item
          })
      })
      return urls
  })
  for (let index = 0; index < urlsByGoogle.length; index++) {
      const element = urlsByGoogle[index];
      if(element.id === 'phephimz.net') {
          const idVideo = element.href.match(/-(\d+).html/)[1]
          await initPlayer(`https://phephim.xyz/embed/video?id=${idVideo}`)
      }
  }

  await browser.close();
  console.log(m3u8Urls);
  return m3u8Urls
}

async function initPlayer(url) {
    const { protocol, host, search } = new URL(url)
    if (!/id=(\d+)/.test(search)) return handleShowError(0, 'Không tìm thấy id của video.')
    vid = search.match(/id=(\d+)/)[1]
    const vinfo = protocol + '//' + host + '/api/getvinfo?callback=json&vid=' + vid
    const video = await fetchApi(vinfo)
    if(!video) return
    const m3u8Url = video.data.host + '/vod/v2/packaged:mp4/' + video.data.mid + '/playlist.m3u8'

    m3u8Urls.push(m3u8Url)
}

const fetchApi = async (url) => {
    const config = {
      method: 'get',
      url: url,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    };
    
    const response = await axios(config)
    return response.data
}

module.exports = {
  run: run
}