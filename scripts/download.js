;(async () => {
  const fs = require ('fs')

  const sharp = require ('sharp')
  const axios = require ('axios')

  require ('green_curry') (['globalize', 'short F.c'])

  if (process.argv.length != 4) {
    F.log ('Usage: node download.js [season url path] [card untranslated name]')
    F.log ('http://minionmastersthegame.com/updates/[season url path]/images/[cud].jpg')
    return
  }

  // get image name and expansion path from command line
  const [,, season_name, card_name] = process.argv

  // make request for art
  const output = `./output/${S.lower (card_name)}.jpg`
  const writer = fs.createWriteStream (output)
  ;(await axios ({
    url: `http://minionmastersthegame.com/updates/${season_name}/images/${card_name}.jpg`,
    method: 'GET',
    responseType: 'stream',
  })).data.pipe (writer)

  await new Promise ((resolve, reject) => {
    writer.on ('finish', resolve)
    writer.on ('error', reject)
  })

  await new Promise (setTimeout)

  await sharp (output)
  .png ()
  .resize (216, 256)
  .toFile (`./assets/${S.lower (card_name)}.png`)

  fs.unlinkSync (output)
})()
