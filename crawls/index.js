const puppeteer = require('puppeteer-extra');
const axios = require('axios');
let m3u8Urls = []
const run = async (keyword) => {
  m3u8Urls = []
  const browser = await puppeteer.launch({headless: false, args: ['--no-sandbox','--disable-setuid-sandbox']})
  const page = await browser.newPage()

  await page.goto('https://www.google.com/', { waitUntil: 'networkidle2', timeout: 0 })
  console.log(keyword);
  if(!hasNumber(keyword)) keyword = keyword + 'Tập 1'
  await page.type('input[class="gLFyf gsfi"]', `phim ${keyword}`)
  await page.keyboard.press('Enter')
  await page.waitForNavigation()
  const urlsByGoogle = await page.evaluate(() => {
      const urls = []

      const $URLS = [...document.querySelectorAll('.yuRUbf > a')]
      const origins = $URLS.map(item => new URL(item).origin)
      const hrefs = $URLS.map(item => item.href)

      const DOMAIN_ALLOW = ['phephimz.net', 'mephimnhat.com', 'motphjm.net']
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
        await page.goto(element.href, { waitUntil: 'networkidle2', timeout: 0 })

        const idVideo = await page.evaluate(() => {
          // Browser Page Environment
          try {
            return EpisodeID
          } catch (error) {
            return null
          }
        });
        if(!idVideo) break
        // await page.waitForSelector("iframe");
        // console.log('load');
        // console.log(idVideo);
        await initPlayer(`https://phephim.xyz/embed/video?id=${idVideo}`)
    }

    if(element.id === 'mephimnhat.com') {
      await page.goto(element.href, { waitUntil: 'networkidle2', timeout: 0 })
      const url = await page.evaluate(() => {
        // Browser Page Environment
        return document.querySelector('#fimfast-player iframe')?.src
      });
      if(!url) break
      const urlParams = new URLSearchParams(new URL(url).search)
      const m3u8Url = urlParams.get('url')
      // console.log(urlParams);
      m3u8Urls.push(m3u8Url)
    }

    if(element.id === 'motphjm.net') {
      await page.goto(element.href, { waitUntil: 'networkidle2', timeout: 0 })
      const url = await page.evaluate(() => {
        // Browser Page Environment
        return document.querySelector('#player iframe')?.src
      });
      if(!url) break
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 })
      const m3u8Url = await page.evaluate(() => {
        // Browser Page Environment
        console.log(xdata.linkPlay);
        return xdata?.linkPlay
      });
      // await page.waitForSelector("iframe");
      m3u8Urls.push(m3u8Url)
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

function hasNumber(myString) {
  return /\d/.test(myString);
}
module.exports = {
  run: run
}