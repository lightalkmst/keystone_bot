const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const end = require ('../../src/handlers/end')

describe ('end', () => {
  beforeEach (reset_globals)

  // TODO: update to confirm cleaned up functionality
  it ('ends the tournament', async () => {
    let cleaned_up = false
    const req = basic_mock_request ('end')
    const m = await end ({
      ... req,
      util: {
        ... req.util,
        cleanup: () => cleaned_up = true,
      },
    })
    assert (cleaned_up)
    assert (dirty)
  })

  // TODO: update to confirm cleaned up functionality
  it ('does not end the tournament if there are still games in progress', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }, {
      discriminator: 'test_discriminator2',
      history: [],
      id: 'test_id2',
      mmr: 1000,
      username: 'test_username2'
    }]
    joined = [{
      decks: [],
      id: 'test_id',
      matchups: [{
        id: 'test_id2',
        result: 'pending',
      }],
      playing: true,
      points: 0,
      team: [],
    }, {
      decks: [],
      id: 'test_id2',
      matchups: [{
        id: 'test_id',
        result: 'pending',
      }],
      playing: true,
      points: 0,
      team: [],
    }]
    let cleaned_up = false
    const req = basic_mock_request ('end')
    const m = await end ({
      ... req,
      util: {
        ... req.util,
        cleanup: () => cleaned_up = true,
      },
    })
    assert (! cleaned_up)
    assert (! dirty)
  })

  test_checks ({
    handler: end,
    functionality: 'end the tournament',
    message: 'end',
    errors: [
      NOT_IN_PROGRESS_ERROR,
    ],
  })
})
