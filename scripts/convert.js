;(async () => {
  const fs = require ('fs')

  const sharp = require ('sharp')

  require ('green_curry') (['globalize', 'short F.c'])

  const files = fs.readdirSync ('./temp')

  await A.P.p.iter (async x => {
    await sharp (`./temp/${x}`)
    .jpeg ({
      quality: 70,
    })
    .resize (216, 256)
    .toFile (`./temp2/${S.split (/\./) (x) [0]}.jpg`)
  }) (files)
}) ()
