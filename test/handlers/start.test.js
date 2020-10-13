const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  mock_player,
  mock_joined,
  test_checks,
} = require ('../_test_utils')

const start = require ('../../src/handlers/start')

describe ('start', () => {
  beforeEach (reset_globals)

  it ('starts the tournament', async () => {
    players = A.map (mock_player) ([1, 2])
    joined = A.map (mock_joined) ([1, 2])
    const req = basic_mock_request ('start')
    const m = await start (req)
    assert (in_progress)
    assert (! dirty)
  })

  it ('does not start the tournament if there are not enough players')

  test_checks ({
    handler: start,
    functionality: 'start the tournament',
    message: 'start',
    errors: [
      IN_PROGRESS_ERROR,
    ],
  })
})
