const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  mock_player,
  mock_joined,
  test_checks,
} = require ('../_test_utils')

const teammates = require ('../../src/handlers/teammates')

describe ('teammates', () => {
  beforeEach (reset_globals)

  it ('posts a list of your teammates', async () => {
    players = A.map (mock_player) ([1, 2])
    joined = [{
      ... mock_joined (1),
      team: ['test_id2'],
    }]
    const req = basic_mock_request ('teammates')
    const m = await teammates ({
      ... req,
      info: {
        ... req.info,
        captain: joined [0],
      },
    })
    assert.deepEqual (messages.message,  [
      `Your team is:`,
      'test_id1',
      'test_id2',
    ])
    assert (! dirty)
  })

  test_checks ({
    handler: teammates,
    functionality: 'posts a list of your teammates',
    message: 'teammates',
    errors: [
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
    ],
  })
})
