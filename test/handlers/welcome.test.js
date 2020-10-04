const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
} = require ('../_test_utils')

const welcome = require ('../../src/handlers/welcome')

describe ('welcome', () => {
  beforeEach (reset_globals)

  it ('does not post if a tournament is in progress', async () => {
    const req = basic_mock_request ('welcome')
    try {
      await welcome ({
        ... req,
        checks: {
          ... req.checks,
          not_in_progress_check: () => F.throw (IN_PROGRESS_ERROR)
        },
      })
      assert.fail ()
    }
    catch (err) {
      assert.equal (err, IN_PROGRESS_ERROR)
    }
  })
})
