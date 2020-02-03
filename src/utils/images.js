const sharp = require ('sharp')
const fs = require ('fs')

const cards = require ('../../cards')
const masters = require ('../../masters')
const all = [ ... masters, ... cards ]

const config = require ('../../config')
const rules = config.rules
const validation = require ('./validation')

const height = 256
const width = 216

const get_deck = user_id => async d => {
  await sharp ({
    create: {
      width: width * (validation.get_cards (d).length + 1),
      height: height,
      channels: 4,
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      }
    }
  })
  .jpeg ({ quality: 50 })
  .composite (
    F.p ([validation.get_master (d), ...validation.get_cards (d)]) (
      A.mapi (i => x => ({
        input: `assets/${S.lower (x)}.jpg`,
        top: 0,
        left: i * width,
        name: x,
      }))
      >> A.filter (x => x.name)
      >> A.filter (x => A.contains (x.name) (all))
    )
  )
  .toFile (`${config.temp_images_path}/${user_id}.jpg`)
}

const get_sideboard = user_id => async d => {
  await sharp ({
    create: {
      width: width * (validation.get_cards (d).length + 1),
      height: height,
      channels: 4,
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      }
    }
  })
  .jpeg ({ quality: 50 })
  .composite (
    F.p (['', ...validation.get_cards (d)]) (
      A.mapi (i => x => ({
        input: `assets/${S.lower (x)}.jpg`,
        top: 0,
        left: i * width,
        name: x,
      }))
      >> A.filter (x => x.name)
      >> A.filter (x => A.contains (x.name) (cards))
    )
  )
  .toFile (`${config.temp_images_path}/${user_id}.jpg`)
}

const get_decklist = user_id => async p => {
  const decks = [
    ...F.p (A.range (1) (rules.number_of_decks)) (
      A.map (F['+'] ('deck'))
      >> A.map (F.swap (D.get) (p))
    ),
    ...(rules.has_sideboarding ? [p.sideboard] : []),
  ]
  await sharp ({
    create: {
      width: width * F.p (decks) (A.map (validation.get_cards) >> A.map (x => x.length + 1) >> A.fold (a => x => a > x ? a : x) (0)),
      height: height * (rules.number_of_decks + (rules.has_sideboarding ? 1 : 0)),
      channels: 4,
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      }
    }
  })
  .jpeg ({ quality: 50 })
  .composite (
    F.p (decks) (
      A.mapi (i => d =>
        F.p ([validation.get_master (d), ...validation.get_cards (d)]) (
          A.mapi (i2 => x => ({
            input: `assets/${S.lower (x)}.jpg`,
            top: i * height,
            left: i2 * width,
            name: x,
          }))
          >> A.filter (x => x.name)
          >> A.filter (x => A.contains (x.name) (all))
        )
      )
      >> A.reduce (A.append)
    )
  )
  .toFile (`${config.temp_images_path}/${user_id}.jpg`)
}

module.exports = {
  get_deck,
  get_sideboard,
  get_decklist,
}
