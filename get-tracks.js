// Load dotenv config into environment
// https://www.npmjs.com/package/dotenv
require('dotenv').config()

const async = require('async')
const fs = require('fs')
const spotify = require('./spotify')

const processTracksForYear = async (year) => {
  // Get tracks for the year
  const tracks = (await spotify.getTracksFromYear(year))
    .filter(track => !!track.preview_url)
  console.log('\tFound', tracks.length, 'tracks')

  // Get audio features for each track
  const results = []
  const queue = await async.queue(async (track) => {
    // Get the track audio features
    const features = await spotify.getAudioFeatures(track.id)
    if (!features)
      return

    // Combine track metadata and audio features
    results.push({
      id: track.id,
      name: track.name,
      popularity: track.popularity,
      explicit: track.explicit ? 1 : 0,
      artists: track.artists.map(a => a.name),
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      release_date: track.album.release_date,
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
  }, 10)
  queue.push(tracks)
  await queue.drain()

  // Write the data to a file
  console.log('\tSaving results')
  const output = { tracks: results }
  fs.writeFileSync(`tracks/tracks-${year}.json`, JSON.stringify(output), 'utf8')
}

const main = async () => {
  await spotify.authenticate()

  let year = 2003
  while (year-- >= 1921) {
    console.log('Processing', year)
    await processTracksForYear(year)
  }
}

main()
