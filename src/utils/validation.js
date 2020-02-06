const config = require ('../../config')
const rules = config.rules

const cards = require ('../../cards')
const masters = require ('../../masters')

const uniq = l => {
  var dups = {}
  A.iter (x => dups[x] = null) (l)
  return Object.keys (dups)
}

const is_cud = S.match (/^[a-zA-Z]*: ([a-zA-Z0-9-]+, ){0,9}[a-zA-Z0-9-]+$/)

const is_sideboard = S.match (/^[a-zA-Z]*: ([a-zA-Z0-9-]+, ){0,9}[a-zA-Z0-9-]+$/)

const get_master = F.c (
  S.split (':')
  >> A.get (0)
)

const get_cards = F.c (
  S.split (' ')
  >> A.tail
  >> S.join (' ')
  >> S.split (', ')
)

const validate_deck = d => F.p ([{
  check: ! d,
  message: 'Has a missing deck',
}, {
  check: d && ! is_cud (d),
  message: 'Has a deck not in /cud format',
}, {
  check: d && is_cud (d) && ! A.contains (get_master (d)) (masters),
  message: `Has an invalid master in your deck: ${get_master (d)}`,
}, {
  check: d && is_cud (d) && rules.disable_duplicates && uniq (get_cards (d)).length != get_cards (d).length,
  message: 'May not use duplicate cards within a deck',
}, {
  check: d && is_cud (d) && A.exists (F.neg (F.swap (A.contains) (cards))) (get_cards (d)),
  message: `Has invalid cards in your deck: ${A.filter (F.neg (F.swap (A.contains) (cards))) (get_cards (d))}`,
}]) (
  A.filter (D.get ('check'))
  >> A.map (D.get ('message'))
)

const validate_sideboard = d => F.p ([{
  check: ! d,
  message: 'Has a missing sideboard',
}, {
  check: d && ! is_sideboard (d),
  message: 'Has a sideboard not in /cud format',
}, {
  check: d && is_sideboard (d) && rules.disable_duplicates && (uniq (get_cards (d)).length != get_cards (d).length),
  message: 'May not use duplicate cards within a sideboard',
}, {
  check: d && is_sideboard (d) && (get_cards (d).length != rules.cards_in_sideboard),
  message: `Sideboard should contain exactly ${rules.cards_in_sideboard} cards`,
}, {
  check: d && is_sideboard (d) && A.exists (F.neg (F.swap (A.contains) (cards))) (get_cards (d)),
  message: `Has invalid cards in your sideboard: ${A.filter (F.neg (F.swap (A.contains) (cards))) (cards)}`,
}]) (
  A.filter (D.get ('check'))
  >> A.map (D.get ('message'))
)

const validate_decks = p => {
  const decks =
    F.p (A.range (1) (rules.number_of_decks)) (
      A.map (F['+'] ('deck'))
      >> A.map (F.swap (D.get) (p))
    )
  const deck_validations =
    F.p (decks) (
      A.map (validate_deck)
      >> A.fold (A.append) ([])
    )
  const sideboard_validations = validate_sideboard (p.sideboard)
  const cross_deck_validations =
    F.p ([{
      check: (
        F.p (decks) (
          A.filter (is_cud)
          >> A.map (get_master)
          >> uniq
          >> D.get ('length')
          >> F['!='] (4)
        )
      ),
      message: 'May not use duplicate masters',
    // }, {
    //   check: config.disable_cross_deck_duplicates && F.p (decks) (A.filter (is_cud) >> A.map (get_cards) >> A.fold (A.append) ([]) >> uniq >> A.length >> F['!='] (40)),
    //   message: 'You may not use duplicate cards across decks',
    }]) (
      A.filter (D.get ('check'))
      >> A.map (D.get ('message'))
    )
  return ([
    ...deck_validations,
    ...sideboard_validations,
    ...cross_deck_validations,
  ])
}

const validate_match_deck = p => d => {
  const decks =
    F.p (A.range (1) (rules.number_of_decks)) (
      A.map (F['+'] ('deck'))
      >> A.map (F.swap (D.get) (p))
      >> A.filter (F.id)
    )
  const deck = A.try_find (x => get_master (x) === get_master (d)) (decks)
  if (! deck) {
    return ['Uses a master that was not submitted']
  }
  const cards = get_cards (d)
  const missing = A.filter (F.swap (A.contains) ([... get_cards (deck), ... get_cards (p.sideboard)])) (cards)
  return F.p ([{
    check: missing.length,
    message: `Has cards that are not in the master's deck or sideboard: ${S.join (', ') (missing)}`,
  }, {
    check: uniq (cards).length < 10,
    message: 'Has duplicate cards',
  }]) (
    A.filter (D.get ('check'))
    >> A.map (D.get ('message'))
  )
}

module.exports = {
  is_cud,
  is_sideboard,
  get_master,
  get_cards,
  validate_deck,
  validate_sideboard,
  validate_decks,
}
