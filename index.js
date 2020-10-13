const Discord = require ('discord.js')
const client = new Discord.Client ()
const fs = require ('fs')
const { promisify } = require ('util')

global.client = client

const {
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
} = require ('./src/init')

const util = require ('./src/util')

const {
  save_state,
  load_state,
} = require ('./src/persistence')

// TODO: add forever.js to prevent bot from shutting down

;(async () => {
  await load_state ()
  setInterval (save_state, config.save_state_interval)

  client.on ('message', async message => {
    if (S.index (config.prefix) (message.content) != 0)
      return

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
    const captain = id && A.try_find (x => x.id === player.id || A.contains (player.id) (x.team)) (joined)

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
    const captain_check = check (NOT_CAPTAIN_ERROR) (player && ! player.playing || captain && captain.id === player.id)

    const messaging = util.create_messaging_utils (client) (message)
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
      const router = command =>
        F.match (command)
        .case (`${config.prefix}welcome`) (F.const (welcome))
        .case (`${config.prefix}register`) (F.const (register))
        .case (`${config.prefix}join`) (F.const (join))
        .case (`${config.prefix}team`) (F.const (team))
        .case (`${config.prefix}teammates`) (F.const (teammates))
        .case (`${config.prefix}deck`) (F.const (deck))
        .case (`${config.prefix}decks`) (F.const (decks))
        .case (`${config.prefix}status`) (F.const (status))
        .case (`${config.prefix}scoreboard`) (F.const (scoreboard))
        .case (`${config.prefix}leaderboard`) (F.const (leaderboard))
        .case (`${config.admin_prefix}mode`) (F.const (mode))
        .case (`${config.admin_prefix}start`) (F.const (start))
        .case (`${config.admin_prefix}next`) (F.const (next))
        .case (`${config.prefix}play`) (F.const (play))
        .case (`${config.prefix}win`) (F.const (record (['win', 'loss'])))
        .case (`${config.admin_prefix}win`) (F.const (record  (['win', 'loss'])))
        .case (`${config.prefix}lose`) (F.const (record  (['loss', 'win'])))
        .case (`${config.admin_prefix}lose`) (F.const (record  (['loss', 'win'])))
        .case (`${config.prefix}draw`) (F.const (record  (['draw', 'draw'])))
        .case (`${config.admin_prefix}draw`) (F.const (record  (['draw', 'draw'])))
        .case (`${config.prefix}score`) (F.const (score))
        .case (`${config.prefix}drop`) (F.const (drop))
        .case (`${config.admin_prefix}drop`) (F.const (drop))
        .case (`${config.admin_prefix}end`) (F.const (end))
        .case (`${config.admin_prefix}mmr`) (F.const (mmr))
        .case (`${config.prefix}help`) (F.const (help))
        .default (F.const (() => messaging.send_message (`That is not a valid command\nUse ${config.prefix}help to list available commands`)))
      await router (command) ({
        messaging,
        info,
        util,
        checks,
      })
    }
    catch (err) {
      const default_message = 'There was an error processing your request'
      const player_has = is_admin_command ? 'Player has' : 'You have'
      const err_message =
        F.match (err)
        .case (REGISTERED_ERROR) (F.const (`${player_has} already registered in this system`))
        .case (NOT_REGISTERED_ERROR) (F.const (`${player_has} not registered in this system with ${config.prefix}register yet`))
        .case (JOINED_ERROR) (F.const (`${player_has} already joined the tournament`))
        .case (NOT_JOINED_ERROR) (F.const (`${player_has} not joined this tournament with ${config.prefix}join yet`))
        .case (IN_PROGRESS_ERROR) (F.const (`The tournament has already started`))
        .case (NOT_IN_PROGRESS_ERROR) (F.const (`The tournament has not started yet`))
        .case (NOT_PLAYING_ERROR) (F.const (`${player_has} not begun the round yet`))
        .case (NOT_CAPTAIN_ERROR) (F.const (`This command should be run by the team captain instead`))
        .default (F.const (default_message))
      await messaging.send_message (err_message)
      if (err_message === default_message) {
        await messaging.send_dev_messages ([message.content, err.message, err.stack])
      }
    }
  })

  client.login (config.bot_token)
}) ()
