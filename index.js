// Load dotenv config into environment
// https://www.npmjs.com/package/dotenv
require('dotenv').config()
const { client_id, client_secret } = process.env

const axios = require('axios')
const async = require('async')
const fs = require('fs')

const encodeParams = params =>
  Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&')

const getToken = () => {
  return axios.post(
    'https://accounts.spotify.com/api/token',
    encodeParams({
      grant_type: 'client_credentials',
    }),
    {
      auth: {
        username: client_id,
        password: client_secret,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  ).then(response => {
    return response.data.access_token
  })
}

const sleep = async ms =>
  new Promise(resolve => setTimeout(resolve, ms))

const smartGet = (url, params) => {
  return sleep(50)
    .then(() => axios.get(url, params))
    .then(response => {
      return response.data
    })
    .catch(error => {
      const { response } = error;
      if (response.status === 429) {
        const { 'retry-after': retryAfter } = response.headers
        console.log('retry after', retryAfter)
        return sleep(retryAfter * 1000 + 10).then(() => smartGet(url, params))
      }
      console.error(error)
      return null
    })
}

const worker = tracks => async track => {
  if (!track.preview_url)
    return

  const features = await smartGet(`https://api.spotify.com/v1/audio-features/${track.id}`)
  tracks.push({
    id: track.id,
    name: track.name,
    popularity: track.popularity,
    explicit: track.explicit ? 1 : 0,
    artists: track.artists.map(a => a.name),
    duration_ms: track.duration_ms,
    preview_url: track.preview_url,
    key: features.key,
    mode: features.mode,
    acousticness: features.acousticness,
    danceability: features.danceability,
    energy: features.energy,
    instrumentalness: features.instrumentalness,
    liveness: features.liveness,
    loudness: features.loudness,
    speechiness: features.speechiness,
    valence: features.valence,
    tempo: features.tempo,
  })
}

const main = async () => {
  // Authenticate
  const token = await getToken()
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  console.log('Token:', token)

  let year = 2020;
  while (year-- >= 1921) {
    console.log(`searching ${year}`)

    // Perform search
    const params = {
      q: `year:${year}`,
      type: 'track',
      market: 'GB',
      limit: 50,
    }

    let tracks = []
    let url = `https://api.spotify.com/v1/search?${encodeParams(params)}`
    while (url !== null) {
      const response = await smartGet(url)
      if (!response)
        break
      const { tracks: { items, next } } = response;
      tracks.push(...items)
      if (tracks.length >= 2000)
        break
      url = next
    }
    console.log('got', tracks.length, 'tracks')

    const results = []
    const queue = await async.queue(worker(results), 3)
    queue.push(tracks)
    await queue.drain()

    console.log('got', results.length, 'results')
    const output = { tracks: results }
    fs.writeFileSync(`tracks/tracks-${year}.json`, JSON.stringify(output), 'utf8')
  }
}

main()
