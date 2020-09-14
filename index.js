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
  console.log('Token:', token)
}

main();
