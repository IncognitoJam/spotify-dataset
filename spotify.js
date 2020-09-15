const axios = require('axios')
const { encodeParams, sleep } = require('./utils')

const get = (uri, params) => {
  return axios.get(`${uri}${params ? `?${encodeParams(params)}` : ''}`)
    .then(response => response.data)
    .catch(error => {
      const { response } = error
      if (response.status === 429) {
        const { 'retry-after': retryAfter } = response.headers
        return sleep((retryAfter + (5 * Math.random())) * 1000)
          .then(() => get(uri, params))
      }
      console.error(error)
      return null
    })
}

/**
 * Authenticate against Spotify using the client credentials and configure
 * Axios to use the token for future requests.
 */
const authenticate = async () => {
  const { client_id, client_secret } = process.env

  const { data: { access_token: token } } = await axios.post(
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
  )
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const search = async (params) => {
  return get(`https://api.spotify.com/v1/search?${encodeParams(params)}`)
}

const getAudioFeatures = async (trackId) => {
  return get(`https://api.spotify.com/v1/audio-features/${trackId}`)
}

const getTracksFromYear = async (year) => {
  // Search query parameters
  const params = {
    q: `year:${year}`,
    type: 'track',
    market: 'GB',
    limit: 50,
  }

  // Combine tracks from each page of results
  let tracks = []
  let url
  do {
    const { tracks: { items, next } } = url ?
      await get(url) :
      await search(params)

    tracks.push(...items)

    // Stop after 2000 tracks as we cannot load more pages
    if (tracks.length >= 2000)
      break
    url = next
  } while (url !== null)

  return tracks
}

module.exports = {
  authenticate,
  search,
  getAudioFeatures,
  get,
  getTracksFromYear,
};
