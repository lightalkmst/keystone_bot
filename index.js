const Discord = require ('discord.js')
const client = new Discord.Client ()
const fs = require ('fs')
const { promisify } = require ('util')
const AWS = require ('aws-sdk')
const S3 = new AWS.S3 (require ('./credentials'))

require ('green_curry') (['globalize'])

const config = require ('./config')
global.config = config
const rules = config.rules
global.rules = rules

const welcome = require ('./src/handlers/welcome')
const register = require ('./src/handlers/register')
const join = require ('./src/handlers/join')
const team = require ('./src/handlers/team')
const teammates = require ('./src/handlers/teammates')
const deck = require ('./src/handlers/deck')
const decks = require ('./src/handlers/decks')
const status = require ('./src/handlers/status')
const scoreboard = require ('./src/handlers/scoreboard')
const leaderboard = require ('./src/handlers/leaderboard')
const mode = require ('./src/handlers/mode')
const start = require ('./src/handlers/start')
const next = require ('./src/handlers/next')
const play = require ('./src/handlers/play')
const record = require ('./src/handlers/record')
const score = require ('./src/handlers/score')
const drop = require ('./src/handlers/drop')
const end = require ('./src/handlers/end')
const mmr = require ('./src/handlers/mmr')
const help = require ('./src/handlers/help')

global.REGISTERED_ERROR = {}
global.NOT_REGISTERED_ERROR = {}
global.JOINED_ERROR = {}
global.NOT_JOINED_ERROR = {}
global.IN_PROGRESS_ERROR = {}
global.NOT_IN_PROGRESS_ERROR = {}
global.NOT_PLAYING_ERROR = {}
global.NOT_CAPTAIN_ERROR = {}

global.in_progress = false
global.round = 1
/*
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
/*
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

const get_player_by_id = id => A.try_find (x => x.id === id) (players)

const user_string = u => `${u.username}#${u.discriminator}`
const user_string_by_id = id => user_string (client.fetchUser (id))

// richard-knuth
global.shuffle = array => {
  var currentIndex = array.length, temporaryValue, randomIndex
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor (Math.random () * currentIndex)
    currentIndex -= 1
    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}

const get_team_mmr = joined => A.fold (F ['+']) (0) (A.map (get_player_by_id) ([joined.id, ... joined.team]))

// seeds according to mmr ratings
global.seed = joined => {
  const joined2 = A.sort (x => y => get_team_mmr (x) - get_team_mmr (y)) (joined)
  const joined3 = A.create (Math.pow (2, Math.ceil (Math.log2 (joined2.length)))) (null)
  for (const i in joined2) {
    const p = joined2 [i]
    joined3 [i < joined3.length / 2 ? i * 2 : joined3.length - (i - joined3.length / 2) * 2 - 1] = p
  }
  return players3
}

const swiss = require ('./src/matchmakers/swiss')
const double_elim = require ('./src/matchmakers/double_elimination')

global.matchmaker = swiss

const record_match = result => p => {
  const pjoin = A.find (x => x.id === p.id) (joined)
  const opp = A.find (x => x.id === pjoin.matchups [0].id) (players)
  const ojoin = A.find (x => x.id === opp.id) (joined)
  pjoin.matchups [0].result = result
  pjoin.playing = true
  pjoin.points = undefined
  ojoin.matchups [0].result =
    F.match (result)
    .case ('win') (F.const ('loss'))
    .case ('loss') (F.const ('win'))
    .case ('draw') (F.const ('draw'))
    .case ('drop') (F.const ('bye'))
    .end ()
  ojoin.playing = true
  ojoin.points = undefined
}
global.record_win = record_match ('win')
global.record_draw = record_match ('draw')
global.record_loss = record_match ('loss')
global.record_drop = record_match ('drop')

global.dirty = false
const save_state = async () => {
  if (! dirty) {
    return
  }

  const state = {
    in_progress,
    round,
    players,
    joined,
    dropped,
    brackets,
    matchmaker: matchmaker === swiss ? 'swiss' : 'double_elimination',
  }

  await S3.upload ({
    Bucket: config.bucket_name,
    Key: config.state_file_name,
    Body: JSON.stringify (state, null, 2),
  })
  .promise ()
  dirty = false
}

const load_state = async () => {
  try {
    const state =
      JSON.parse (
        (await S3.getObject ({
          Bucket: config.bucket_name,
          Key: config.state_file_name,
        })
        .promise ())
        .Body
      )

    ;({
      in_progress,
      round,
      players,
      joined,
      dropped,
      brackets,
    } = state)
    matchmaker = {
      swiss,
      double_elimination: double_elim,
    } [state.matchmaker]
  }
  catch (err) {
    console.log ('err:', err.message)
  }
}

const router = command => // TODO: simplify into object selection
  F.match (command)
  .case (`${config.prefix}welcome`) (() => welcome)
  .case (`${config.prefix}register`) (() => register)
  .case (`${config.prefix}join`) (() => join)
  .case (`${config.prefix}team`) (() => team)
  .case (`${config.prefix}teammates`) (() => teammates)
  .case (`${config.prefix}deck`) (() => deck)
  .case (`${config.prefix}decks`) (() => decks)
  .case (`${config.prefix}status`) (() => status)
  .case (`${config.prefix}scoreboard`) (() => scoreboard)
  .case (`${config.prefix}leaderboard`) (() => leaderboard)
  .case (`${config.admin_prefix}mode`) (() => mode)
  .case (`${config.admin_prefix}start`) (() => start)
  .case (`${config.admin_prefix}next`) (() => next)
  .case (`${config.prefix}play`) (() => play)
  .case (`${config.prefix}win`) (() => record)
  .case (`${config.admin_prefix}win`) (() => record)
  .case (`${config.prefix}lose`) (() => record)
  .case (`${config.admin_prefix}lose`) (() => record)
  .case (`${config.prefix}draw`) (() => record)
  .case (`${config.admin_prefix}draw`) (() => record)
  .case (`${config.prefix}score`) (() => score)
  .case (`${config.prefix}drop`) (() => drop)
  .case (`${config.admin_prefix}drop`) (() => drop)
  .case (`${config.admin_prefix}end`) (() => end)
  .case (`${config.admin_prefix}mmr`) (() => mmr)
  .case (`${config.prefix}help`) (() => help)
  .default (() => async () => await send_message (`That is not a valid command\nUse ${config.prefix}help to list available commands`)) // TODO: help message to use help

;(async () => {
  await load_state ()
  setInterval (save_state, config.save_state_interval)

  client.on ('message', async message => {
    if (S.index (config.prefix) (message.content) != 0)
      return

    const send_message = message.channel.send.bind (message.channel)
    const send_messages = async (ss, opts) => await send_message (S.join ('\n') (ss), opts)
    const send_direct_message = message.author.send.bind (message.author)
    const send_direct_messages = async (ss, opts) => await send_direct_message (S.join ('\n') (ss), opts)
    const send_admin_message = async (s, opts) => (await client.fetchUser (config.support_contact_id)).send (s, opts)
    const send_admin_messages = async (ss, opts) => await send_admin_message (S.join ('\n') (ss), opts)
    const send_dev_message = async (s, opts) => (await client.fetchUser (config.dev_contact_id)).send (s, opts)
    const send_dev_messages = async (ss, opts) => await send_dev_message (S.join ('\n') (ss), opts)
    const send_user_message = async (id, s, opts) => (await client.fetchUser (id)).send (s, opts)
    const send_user_messages = async (id, ss, opts) => await send_user_message (id, S.join ('\n') (ss), opts)
    const send_main_message = async (s, opts) => (await client.channels.get (config.main_channel_id)).send (s, opts)
    const send_main_messages = async (ss, opts) => await send_main_message (S.join ('\n') (ss), opts)
    const send_log_message = async (s, opts) => (await client.channels.get (config.log_channel_id)).send (s, opts)

    const is_admin = A.contains (message.author.id) (config.admins)
    const split_message = S.split (' ') (message.content)
    const n = split_message [1] || ''
    const command = split_message [0]
    const is_admin_command = S.match (new RegExp (`^${config.admin_prefix}`)) (command)
    if (is_admin_command && ! is_admin) {
      await send_message ('You are not an administrator')
      return
    }
    const user_id = message.author.id
    // if the user is an admin and using an admin command, allow them to select the user by discord id
    const id = is_admin_command ? split_message [1] : user_id

    const player = A.try_find (x => x.id === id) (players)
    const player_entry = A.try_find (x => x.id === id) (joined)
    const captain = A.try_find (x => x.id === player.id || A.contains (player.id) (x.team)) (joined)

    const log_command = async () =>
      (await client.channels.get (config.log_channel_id))
      .send (`${user_id} | <@${user_id}> - ${new Date ().toLocaleTimeString ('en-US')}: ${message.content}`)

    const announce_pairings = () =>
      A.P.p.iter (async x => {
        if (! x.matchups [0].id) {
          await send_direct_messages ([`The next round has begun. You received a bye.`])
          return
        }
        const opp = A.find (y => y.id === x.matchups [0].id) (joined)
        await send_user_message (x.id, `The next round has begun. You are matched against ${user_string (opp)}`)
        opp.team.length && await send_user_messages (x.id, [
          `Their teammates are:`,
          ... A.map (user_string_by_id) (opp.team),
        ])
      }) (joined)

    const print_scoreboard = async () => {
      if (matchmaker === double_elim) {
        if (brackets.winners.length + brackets.losers.length === 1) {
          const wid = (brackets.winners [0] || brackets.losers [0]).id
          const player = A.find (x => x.id === wid) (players)
          await send_main_message (`${x.username}#${x.discriminator} is the tournament winner`)
          return
        }
        await send_main_message (`Winners Bracket:`)
        await A.P.s.iter (async x => x && await send_main_message (`${x.username}#${x.discriminator}`)) (A.map (x => A.find (y => y.id === x.id) (players)) (brackets.winners))
        await send_main_message (`Losers Bracket:`)
        await A.P.s.iter (async x => x && await send_main_message (`${x.username}#${x.discriminator}`)) (A.map (x => A.find (y => y.id === x.id) (players)) (brackets.losers))
        return
      }
      const compare = x => y => y.points - x.points // descending
      players = A.sort (compare) (A.map (score) (joined))
      dropped = A.sort (compare) (A.map (score) (dropped))
      await send_main_message (`The current standings:`)
      await A.P.s.iteri (i => async x => {
        const win = A.length (A.filter (y => y.result === 'win') (x.matchups))
        const loss = A.length (A.filter (y => y.result === 'loss') (x.matchups))
        const draw = A.length (A.filter (y => y.result === 'draw') (x.matchups))
        await send_main_message (`${i + 1}) ${x.username}#${x.discriminator} [ ${x.points} points | ${win} W - ${loss} L - ${draw} D ]`)
      }) (players)
      await A.P.s.iteri (i => async x => {
        const win = A.length (A.filter (y => y.result === 'win') (x.matchups))
        const loss = A.length (A.filter (y => y.result === 'loss') (x.matchups))
        const draw = A.length (A.filter (y => y.result === 'draw') (x.matchups))
        await send_main_message (`${i + 1}) ${x.username}#${x.discriminator} [ ${x.points} points | ${win} W - ${loss} L - ${draw} D ] (dropped)`)
      }) (dropped)
    }

    const cleanup = async () => {
      await send_main_message (`The tournament has ended`)
      await print_scoreboard ()
      await send_direct_message (`Please use ${config.prefix}welcome in the public bot channel after any further tournament conclusions`)
      players = A.map (x => {
        // TODO: handle updating mmr for team members and counting team member mmr
        const pjoin = A.try_find (y => y.id === x.id) (players)
        if (! pjoin) {
          return x
        }
        const mmr_deltas = A.map (y => {
          const o = A.find (z => z.id === z.id)
          const pr = Math.pow (10, y.mmr / 400)
          const or = Math.pow (10, o.mmr / 400)
          const pe = pr / (pr + or)
          const ps = {
            win: 1,
            loss: 0,
            draw: 0.5,
            drop: pe,
            bye: pe,
          } [y.result]
          return Math.floor (rules.mmr_k_value * (ps - pe))
        }) (pjoin.matchups)
        return {
          ... x,
          mmr: A.fold (F['+']) (x.mmr) (mmr_deltas),
          history: A.map (x => ({... x [0], change: x [1]})) (A.zip (pjoin.matchups) (mmr_deltas))
        }
      }) (players)
      in_progress = false
      round = 1
      joined = []
      dropped = []
      brackets = null
      await log_command ()
    }

    const check = e => c => () => {
      if (! c) {
        throw e
      }
    }
    const registered_check = check (NOT_REGISTERED_ERROR) (player)
    const not_registered_check = check (REGISTERED_ERROR) (! player)
    const joined_check = check (NOT_JOINED_ERROR) (A.exists (x => x.id === (player && player.id) || A.contains (player && player.id) (x.team)) (joined))
    const not_joined_check = check (JOINED_ERROR) (A.for_all (x => x.id !== (player && player.id) && ! A.contains (player && player.id) (x.team)) (joined))
    const in_progress_check = check (NOT_IN_PROGRESS_ERROR) (in_progress)
    const not_in_progress_check = check (IN_PROGRESS_ERROR) (! in_progress)
    const playing_check = check (NOT_PLAYING_ERROR) (player && player.playing)
    const captain_check = check (NOT_CAPTAIN_ERROR) (captain && captain.id === player.id) // TODO: fix for when player hasn't joined yet

    const messaging = {
      send_message,
      send_messages,
      send_direct_message,
      send_direct_messages,
      send_admin_message,
      send_admin_messages,
      send_dev_message,
      send_dev_messages,
      send_user_message,
      send_user_messages,
      send_main_message,
      send_main_messages,
      send_log_message,
      log_command,
    }
    const info = {
      message,
      is_admin,
      split_message,
      n,
      command,
      is_admin_command,
      user_id,
      id,
      player,
      player_entry,
      captain,
    }
    const util = {
      user_string_by_id,
      user_string,
      announce_pairings,
      print_scoreboard,
      cleanup,
    }
    const checks = {
      registered_check,
      not_registered_check,
      joined_check,
      not_joined_check,
      in_progress_check,
      not_in_progress_check,
      playing_check,
      captain_check,
    }

    try {
      await router (command) ({
        messaging,
        info,
        util,
        checks,
      })
    }
    catch (err) {
      switch (err) {
        case REGISTERED_ERROR:
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} already registered in this system`)
          return
        case NOT_REGISTERED_ERROR:
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} not registered in this system with !register yet`)
          return
        case JOINED_ERROR:
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} already joined the tournament`)
          return
        case NOT_JOINED_ERROR:
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} not joined this tournament with !join yet`)
          return
        case IN_PROGRESS_ERROR:
          await send_message (`The tournament has already started`)
          return
        case NOT_IN_PROGRESS_ERROR:
          await send_message (`The tournament has not started yet`)
          return
        case NOT_PLAYING_ERROR:
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} not begun the round yet`)
          return
        case NOT_CAPTAIN_ERROR:
          await send_message (`This command should be run by the team captain instead`)
          return
        default:
          await send_message ('There was an error processing your request')
          await send_dev_messages ([message.content, err.message, err.stack])
          return
      }
    }
  })

  client.login (config.bot_token)
}) ()
