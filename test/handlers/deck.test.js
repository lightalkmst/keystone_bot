const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
} = require ('../_test_utils')

const deck = require ('../../src/handlers/deck')

describe ('deck', () => {
  beforeEach (reset_globals)

  it ('adds a deck to your roster', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username',
    }]
    joined = [{
      decks: [],
      id: 'test_id',
      matchups: [],
      playing: true,
      points: 0,
      team: [],
    }]
    const req = basic_mock_request ('deck 1')
    const m = await deck ({
      ... req,
      info: {
        ... req.info,
        message: {
          ... req.info.message,
          attachments: {first: F.const ({url: 'test_url'})},
        },
        player_entry: joined [0],
      },
    })
    assert.deepEqual (joined, [{
      decks: ['test_url'],
      id: 'test_id',
      matchups: [],
      playing: true,
      points: 0,
      team: [],
    }])
    assert (dirty)
  })

  F.p ([{
    name: 'if you are not the captain',
    check: 'captain_check',
    error: NOT_CAPTAIN_ERROR,
  }, {
    name: 'if you are not registered',
    check: 'registered_check',
    error: NOT_REGISTERED_ERROR,
  }, {
    name: 'if you have not joined the tournament',
    check: 'joined_check',
    error: NOT_JOINED_ERROR,
  }, {
    name: 'if the tournament is in progress',
    check: 'not_in_progress_check',
    error: IN_PROGRESS_ERROR,
  }]) (A.iter (test =>
    it (`does not add a deck ${test.name}`, async () => {
      const req = basic_mock_request ('deck 1')
      try {
        await deck ({
          ... req,
          checks: {
            ... req.checks,
            [test.check]: () => F.throw (test.error)
          },
        })
        assert.fail ()
      }
      catch (err) {
        assert.equal (err, test.error)
      }
    })
  ))

  it ('does not add a deck if you specify an invalid slot', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username',
    }]
    joined = [{
      decks: [],
      id: 'test_id',
      matchups: [],
      playing: true,
      points: 0,
      team: [],
    }]
    const req = basic_mock_request ('deck 0')
    await deck ({
      ... req,
      info: {
        ... req.info,
        message: {
          ... req.info.message,
          attachments: {first: F.const ({url: 'test_url'})},
        },
        player_entry: joined [0],
      },
    })
    assert.deepEqual (joined [0].decks, [])
  })
})
