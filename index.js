// Load dotenv config into environment
// https://www.npmjs.com/package/dotenv
require('dotenv').config()
const { client_id, client_secret } = process.env

const axios = require('axios')

const encodeParams = (params) =>
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
  ).then((response) => {
    return response.data.access_token
  })
}

const main = async () => {
  const token = await getToken()
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  console.log('Token:', token)

  const { data } = await axios.get('https://api.spotify.com/v1/tracks/2TpxZ7JUBn3uw46aR7qd6V')
  console.log(data)
}

main();
