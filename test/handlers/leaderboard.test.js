const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  mock_player,
  mock_joined,
} = require ('../_test_utils')

const leaderboard = require ('../../src/handlers/leaderboard')

describe ('leaderboard', () => {
  beforeEach (reset_globals)

  it ('posts the leaderboard', async () => {
    players = A.map (i => ({... mock_player (i), mmr: i})) (A.range (1) (20))
    const req = basic_mock_request ('leaderboard')
    const m = await leaderboard (req)
    assert.deepEqual (messages.message, [
      'test_id20',
      'test_id19',
      'test_id18',
      'test_id17',
      'test_id16',
      'test_id15',
      'test_id14',
      'test_id13',
      'test_id12',
      'test_id11',
    ])
    assert (! dirty)
  })

  it ('posts less than the full amount if there are not enough players')
})
