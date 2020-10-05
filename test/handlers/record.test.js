const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const record = require ('../../src/handlers/record')

describe ('record', () => {
  beforeEach (reset_globals)

  F.p ([{
    results: ['win', 'loss'],
  }, {
    results: ['loss', 'win'],
  }, {
    results: ['draw', 'draw'],
  }]) (
    A.iter (({
      results,
    }) => {
      const handler = record (results)

      it (`records a ${results [0]} for you and a ${results [1]} for your opponent`)

      test_checks ({
        handler,
        functionality: `record a ${results [0]} for you and a ${results [1]} for your opponent`,
        message: results [0],
        errors: [
          NOT_CAPTAIN_ERROR,
          NOT_REGISTERED_ERROR,
          NOT_JOINED_ERROR,
          NOT_IN_PROGRESS_ERROR,
          NOT_PLAYING_ERROR,
        ],
      })
    })
  )
})
