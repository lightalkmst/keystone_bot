;(async () => {
  const fs = require ('fs')

  const sharp = require ('sharp')

  require ('green_curry') (['globalize', 'short F.c'])

  if (process.argv.length != 4) {
    F.log ('Usage: node download.js [image path] [card untranslated name]')
    return
  }

  // get image name and expansion path from command line
  const [,, image_path, card_name] = process.argv

  await sharp (image_path)
  .png ()
  .resize (216, 256)
  .toFile (`./assets/${S.lower (card_name)}.png`)

  fs.unlinkSync (image_path)
})()
