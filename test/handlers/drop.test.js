const assert = require ('assert')

const {
  reset_globals,
  basic_mock_request,
  test_checks,
} = require ('../_test_utils')

const drop = require ('../../src/handlers/drop')

describe ('drop', () => {
  beforeEach (reset_globals)

  it ('drops your team from the next tournament', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }]
    joined = [{
      decks: [],
      id: 'test_id',
      matchups: [],
      playing: true,
      points: 0,
      team: [],
    }]
    const req = basic_mock_request ('drop')
    const m = await drop (req)
    assert.deepEqual (joined, [])
    assert (dirty)
  })

  it ('drops your team from the tournament and records a win for your opponent', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }, {
      discriminator: 'test_discriminator2',
      history: [],
      id: 'test_id2',
      mmr: 1000,
      username: 'test_username2'
    }]
    joined = [{
      decks: [],
      id: 'test_id',
      matchups: [{
        id: 'test_id2',
        result: 'pending',
      }],
      playing: true,
      points: 0,
      team: [],
    }, {
      decks: [],
      id: 'test_id2',
      matchups: [{
        id: 'test_id',
        result: 'pending',
      }],
      playing: true,
      points: 0,
      team: [],
    }]
    const req = basic_mock_request ('drop')
    const m = await drop ({
      ... req,
      info: {
        ... req.info,
        in_progress: true,
      },
    })
    assert.deepEqual (joined, [{
      decks: [],
      id: 'test_id',
      matchups: [{
        id: 'test_id2',
        result: 'drop',
      }],
      playing: true,
      points: undefined,
      team: [],
    }, {
      decks: [],
      id: 'test_id2',
      matchups: [{
        id: 'test_id',
        result: 'bye',
      }],
      playing: true,
      points: undefined,
      team: [],
    }])
    assert.deepEqual (dropped, [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }])
    assert (dirty)
  })

  it ('drops your team from the tournament and does not overwrite recorded match results', async () => {
    players = [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }, {
      discriminator: 'test_discriminator2',
      history: [],
      id: 'test_id2',
      mmr: 1000,
      username: 'test_username2'
    }]
    joined = [{
      decks: [],
      id: 'test_id',
      matchups: [{
        id: 'test_id2',
        result: 'loss',
      }],
      playing: true,
      points: 0,
      team: [],
    }, {
      decks: [],
      id: 'test_id2',
      matchups: [{
        id: 'test_id',
        result: 'win',
      }],
      playing: true,
      points: 0,
      team: [],
    }]
    const req = basic_mock_request ('drop')
    const m = await drop ({
      ... req,
      info: {
        ... req.info,
        in_progress: true,
      },
    })
    assert.deepEqual (joined, [{
      decks: [],
      id: 'test_id',
      matchups: [{
        id: 'test_id2',
        result: 'loss',
      }],
      playing: true,
      points: 0,
      team: [],
    }, {
      decks: [],
      id: 'test_id2',
      matchups: [{
        id: 'test_id',
        result: 'win',
      }],
      playing: true,
      points: 0,
      team: [],
    }])
    assert.deepEqual (dropped, [{
      discriminator: 'test_discriminator',
      history: [],
      id: 'test_id',
      mmr: 1000,
      username: 'test_username'
    }])
    assert (dirty)
  })

  test_checks ({
    handler: drop,
    functionality: 'drop your team from the tournament',
    message: 'drop',
    errors: [
      NOT_REGISTERED_ERROR,
      NOT_JOINED_ERROR,
      NOT_CAPTAIN_ERROR,
    ],
  })
})
