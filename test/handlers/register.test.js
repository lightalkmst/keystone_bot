const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
} = require ('../_test_utils')

const register = require ('../../src/handlers/register')

describe ('register', () => {
  beforeEach (reset_globals)

  it ('adds you to the player registry', async () => {
    const req = basic_mock_request ('register')
    const m = await register (req)
    assert.deepEqual (players, [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }])
    assert (dirty)
  })

  it ('does not add you to the player registry twice', async () => {
    const req = basic_mock_request ('register')
    try {
      await register ({
        ... req,
        checks: {
          ... req.checks,
          not_registered_check: () => F.throw (REGISTERED_ERROR)
        },
      })
      assert.fail ()
    }
    catch (err) {
      assert.equal (err, REGISTERED_ERROR)
    }
  })
})
