const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const mode = require ('../../src/handlers/mode')

const double_elimination = require ('../../src/matchmakers/double_elimination')
const swiss = require ('../../src/matchmakers/swiss')

describe ('mode', () => {
  beforeEach (reset_globals)

  it ('sets matchmaking mode to swiss', async () => {
    matchmaker = null
    const req = basic_mock_request ('mode swiss')
    const m = await mode (req)
    assert.equal (matchmaker, swiss)
    assert (dirty)
  })

  it ('sets matchmaking mode to double elimination', async () => {
    matchmaker = null
    const req = basic_mock_request ('mode double_elimination')
    const m = await mode (req)
    assert.equal (matchmaker, double_elimination)
    assert (dirty)
  })

  test_checks ({
    handler: mode,
    functionality: 'set matchmaking mode',
    message: 'mode swiss',
    errors: [
      IN_PROGRESS_ERROR,
    ],
  })
})
