const encodeParams = params => {
  return Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&')
}

const sleep = ms => {
  // console.debug('[Utils]', 'sleep', ms);
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  encodeParams,
  sleep,
}
