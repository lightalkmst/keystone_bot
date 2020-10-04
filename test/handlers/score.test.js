const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const score = require ('../../src/handlers/score')

describe ('score', () => {
  beforeEach (reset_globals)

  it ('posts your score for the current tournament')

  test_checks ({
    handler: score,
    functionality: 'posts your score for the current tournament',
    message: 'score',
    errors: [
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
      NOT_IN_PROGRESS_ERROR,
    ],
  })
})
