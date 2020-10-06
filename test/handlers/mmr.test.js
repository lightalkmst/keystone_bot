const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  mock_player,
  test_checks,
} = require ('../_test_utils')

const mmr = require ('../../src/handlers/mmr')

describe ('mmr', () => {
  beforeEach (reset_globals)

  it ('updates a player\'s mmr', async () => {
    players = [mock_player (1)]
    const req = basic_mock_request ('mmr test_id1 10')
    const m = await mmr ({
      ... req,
      info: {
        ... req.info,
        player: players [0],
      },
    })
    assert.deepEqual (players, [{
      discriminator: 'test_discriminator1',
      history: [],
      id: 'test_id1',
      mmr: 10,
      username: 'test_username1',
    }])
    assert (dirty)
  })

  test_checks ({
    handler: mmr,
    functionality: 'set a player\'s mmr',
    message: 'mmr test_id1 10',
    errors: [
      IN_PROGRESS_ERROR,
    ],
  })
})
