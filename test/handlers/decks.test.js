const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const decks = require ('../../src/handlers/decks')

describe ('decks', () => {
  beforeEach (reset_globals)

  test_checks ({
    handler: decks,
    functionality: 'list decks',
    message: 'decks',
    errors: [
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
    ],
  })
})
