const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  mock_player,
  mock_joined,
  test_checks,
} = require ('../_test_utils')

const decks = require ('../../src/handlers/decks')

describe ('decks', () => {
  beforeEach (reset_globals)

  it ('lists your decks', async () => {
    players = [mock_player (1)]
    joined = [{
      ... mock_joined (1),
      decks: ['deck1', 'deck2']
    }]
    const req = basic_mock_request ('decks')
    const m = await decks ({
      ... req,
      info: {
        ... req.info,
        captain: joined [0],
      },
    })
    assert.deepEqual (messages.message, [
      'Your submitted decks are:',
      'Deck 1: deck1',
      'Deck 2: deck2',
    ])
    assert (! dirty)
  })

  test_checks ({
    handler: decks,
    functionality: 'list decks',
    message: 'decks',
    errors: [
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
    ],
  })
})
