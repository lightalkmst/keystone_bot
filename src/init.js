require ('green_curry') (['globalize'])

require ('./errors')

global.config = require ('../config')
global.rules = config.rules

const double_elim = require ('./matchmakers/double_elimination')
const swiss = require ('./matchmakers/swiss')
global.matchmaker = swiss

const welcome = require ('./handlers/welcome')
const register = require ('./handlers/register')
const join = require ('./handlers/join')
const team = require ('./handlers/team')
const teammates = require ('./handlers/teammates')
const deck = require ('./handlers/deck')
const decks = require ('./handlers/decks')
const status = require ('./handlers/status')
const scoreboard = require ('./handlers/scoreboard')
const leaderboard = require ('./handlers/leaderboard')
const mode = require ('./handlers/mode')
const start = require ('./handlers/start')
const next = require ('./handlers/next')
const play = require ('./handlers/play')
const record = require ('./handlers/record')
const score = require ('./handlers/score')
const drop = require ('./handlers/drop')
const end = require ('./handlers/end')
const mmr = require ('./handlers/mmr')
const help = require ('./handlers/help')

global.in_progress = false
global.round = 1
/* these are all of the players registered in the system
{
  id: string,
  username: string
  discriminator: string
  mmr: int
  history: object array; newest first order {
    id: string
    result: string
    change: int; mmr change from the match
  }
}
*/
global.players = []
/* these are all of the players that have joined the next/current tournament
{
  id: string,
  team: string array; ids of teammates
  decks: string array; discord urls to images
  matchups: object array; newest first order {
    id: string
    result: string
  }
  playing: boolean
  points: int
}
*/
global.joined = []
global.dropped = []

module.exports = {
  handlers: {
    welcome,
    register,
    join,
    team,
    teammates,
    deck,
    decks,
    status,
    scoreboard,
    leaderboard,
    mode,
    start,
    next,
    play,
    record,
    score,
    drop,
    end,
    mmr,
    help,
  },
}
