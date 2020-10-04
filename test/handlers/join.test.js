const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
} = require ('../_test_utils')

const join = require ('../../src/handlers/join')

describe ('join', () => {
  beforeEach (reset_globals)

  it ('adds you to the tournament if you are registered', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }]
    const req = basic_mock_request ('join')
    const m = await join (req)
    assert.deepEqual (joined, [{
      decks: [],
      id: 'test_id',
      matchups: [],
      playing: true,
      points: 0,
      team: [],
    }])
    assert (dirty)
  })

  it ('does not add you to the tournament if you already joined', async () => {
    const req = basic_mock_request ('join')
    try {
      await join ({
        ... req,
        checks: {
          ... req.checks,
          not_joined_check: () => F.throw (JOINED_ERROR)
        },
      })
      assert.fail ()
    }
    catch (err) {
      assert.equal (err, JOINED_ERROR)
    }
  })

  it ('does not add you to the tournament if you are not registered', async () => {
    const req = basic_mock_request ('join')
    try {
      await join ({
        ... req,
        checks: {
          ... req.checks,
          registered_check: () => F.throw (NOT_REGISTERED_ERROR)
        },
      })
      assert.fail ()
    }
    catch (err) {
      assert.equal (err, NOT_REGISTERED_ERROR)
    }
  })
})
