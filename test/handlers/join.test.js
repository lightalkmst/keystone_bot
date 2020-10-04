const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
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

  test_checks ({
    handler: join,
    functionality: 'add you to the tournament',
    message: 'join',
    errors: [
      JOINED_ERROR,
      NOT_REGISTERED_ERROR,
    ],
  })
})
