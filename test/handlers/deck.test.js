const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const deck = require ('../../src/handlers/deck')

describe ('deck', () => {
  beforeEach (reset_globals)

  it ('adds a deck to your roster', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username',
    }]
    joined = [{
      decks: [],
      id: 'test_id',
      matchups: [],
      playing: true,
      points: 0,
      team: [],
    }]
    const req = basic_mock_request ('deck 1')
    const m = await deck ({
      ... req,
      info: {
        ... req.info,
        message: {
          ... req.info.message,
          attachments: {first: F.const ({url: 'test_url'})},
        },
        player_entry: joined [0],
      },
    })
    assert.deepEqual (joined, [{
      decks: ['test_url'],
      id: 'test_id',
      matchups: [],
      playing: true,
      points: 0,
      team: [],
    }])
    assert (dirty)
  })

  test_checks ({
    handler: deck,
    functionality: 'add a deck',
    message: 'deck 1',
    errors: [
      NOT_CAPTAIN_ERROR,
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
      IN_PROGRESS_ERROR,
    ],
  })

  it ('does not add a deck if you specify an invalid slot', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username',
    }]
    joined = [{
      decks: [],
      id: 'test_id',
      matchups: [],
      playing: true,
      points: 0,
      team: [],
    }]
    const req = basic_mock_request ('deck 0')
    await deck ({
      ... req,
      info: {
        ... req.info,
        message: {
          ... req.info.message,
          attachments: {first: F.const ({url: 'test_url'})},
        },
        player_entry: joined [0],
      },
    })
    assert.deepEqual (joined [0].decks, [])
  })
})
