const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
} = require ('../_test_utils')

const leaderboard = require ('../../src/handlers/leaderboard')

describe ('leaderboard', () => {
  beforeEach (reset_globals)

  it ('does not fail', async () => {
    const req = basic_mock_request ('leaderboard')
    await leaderboard (req)
  })
})
