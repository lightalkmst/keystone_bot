const Discord = require ('discord.js')
const client = new Discord.Client ()
const fs = require ('fs')
const edmondsBlossom = require ('edmonds-blossom')
const { promisify } = require ('util')
const AWS = require ('aws-sdk')
const S3 = new AWS.S3 (require ('./credentials')) // TODO: confirm this is correct

require ('green_curry') (['globalize'])

const config = require ('./config')
const rules = config.rules

const REGISTERED_ERROR = {}
const NOT_REGISTERED_ERROR = {}
const JOINED_ERROR = {}
const NOT_JOINED_ERROR = {}
const IN_PROGRESS_ERROR = {}
const NOT_IN_PROGRESS_ERROR = {}
const NOT_PLAYING_ERROR = {}

let in_progress = false
let round = 1
let leader = null
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
let players = []
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
let joined = []
let dropped = []

const get_player_by_id = id => A.try_find (x => x.id === id) (players)

const user_string = u => `${u.username}#${u.discriminator}`

// richard-knuth
const shuffle = array => {
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

// swiss pairing
const swiss = players => {
  const maxDiff = round * 3

  const matches = (() => {
    const matches = []
    for (let i = 0; players [i]; i++) {
      for (let i2 = i + 1; players [i2]; i2++) {
        matches.push ([i, i2, A.for_all (x => x.id !== players [i2].id) (players [i].matchups) ? maxDiff - Math.abs (players [i].points - players [i2].points) : 0])
      }
    }
    return edmondsBlossom (matches)
  }) ()

  return A.mapi (i => x => ({
    ... x,
    matchups: [
      matches [i] === -1
      ? {
        result: 'bye',
      }
      : {
        id: players [matches [i]].id,
        result: 'pending',
      },
      ... x.matchups,
    ],
    playing: matches [i] === -1,
  })) (players)
}

let brackets = null
const double_elim = players => {
  const get_matchups = () => {
    return A.mapi (i => x => {
      const wi = A.try_find_index (y => y.id === x.id) (brackets.winners)
      if (wi) {
        return {
          ... x,
          matchups: [
            brackets.winners [wi % 2 ? wi + 1 : wi - 1]
            ? {
              id: brackets.winners [wi % 2 ? wi + 1 : wi - 1].id,
              result: 'pending',
            }
            : {result: 'bye'}
          ]
        }
      }
      const li = A.try_find_index (y => y.id === x.id) (brackets.winners)
      if (li) {
        return {
          ... x,
          matchups: [
            brackets.losers [li % 2 ? li + 1 : li - 1]
            ? {
              id: brackets.losers [li % 2 ? li + 1 : li - 1].id,
              result: 'pending',
            }
            : {result: 'bye'}
          ]
        }
      }
      return {result: 'bye'}
    })
  }

  // generates bracket on first run, just updates and outputs resulting matches in subsequent runs
  if (! brackets) {
    const players2 = shuffle (players)
    players2.length = Math.pow (2, Math.ceil (Math.log2 (players2.length)))
    brackets = {
      winners: A.map (x => x && x.id) (players2),
      losers: [],
    }
    return get_matchups ()
  }

  const pred_won_round = player_id => {
    const join = A.try_find (x => x.id === player_id) (joined)
    return join && A.contains (join.matchups [0].result) (['win', 'bye'])
  }

  if (brackets.winners.length) {
    brackets = {
      winners: A.filter (pred_won_round) (brackets.winners),
      losers: A.fold (a => h => [... a, h [0], h [1]]) ([]) (A.zip (A.filter (pred_won_round) (brackets.losers)) (A.rev (A.filter (F.neg (pred_won_round)) (brackets.winners)))),
    }
  }
  else {
    brackets = {
      ... brackets,
      losers: A.filter (pred_won_round) (brackets.losers),
    }
  }

  if (brackets.winners.length === 1 && brackets.losers.length === 1) {
    const wid = brackets.winners [0].id
    const lid = brackets.losers [0].id
    return A.map (x =>
      x.id === wid
      ? {
        id: lid,
        result: 'pending',
      }
      : x.id === lid
      ? {
        id: wid,
        result: 'pending',
      }
      : {result: 'bye'}
    ) (joined)
  }

  return get_matchups ()
}

let matchmaker = swiss

const score = p =>
  p.points !== undefined
  ? p
  : {
    ... p,
    points:
      F.p (p.matchups) (
        A.map (x =>
          F.match (x.result)
          .case ('win') (() => rules.points_per_win)
          .case ('loss') (() => rules.points_per_loss)
          .case ('draw') (() => rules.points_per_draw)
          .case ('bye') (() => rules.points_per_win)
          .case ('drop') (() => rules.points_per_loss)
          .default (() => 0)
        )
        >> A.fold (F ['+']) (0)
      )
    ,
  }

const record_match = result => p => {
  const pjoin = A.find (x => x.id === p.id) (joined)
  const opp = A.find (x => x.id === pjoin.matchups [0].id) (players)
  const ojoin = A.find (x => x.id === opp.id) (joined)
  pjoin.matchups [0].result = result
  pjoin.playing = true
  pjoin.points = undefined
  switch (result) {
    case 'win':
      ojoin.matchups [0].result = 'loss'
      break
    case 'loss':
      ojoin.matchups [0].result = 'win'
      break
    case 'draw':
      ojoin.matchups [0].result = 'draw'
      break
    case 'drop':
      ojoin.matchups [0].result = 'bye'
      break
  }
  ojoin.playing = true
  ojoin.points = undefined
}
const record_win = record_match ('win')
const record_draw = record_match ('draw')
const record_loss = record_match ('loss')
const record_drop = record_match ('drop')

let dirty = false
const save_state = async () => {
  if (! dirty) {
    return
  }

  const state = {
    in_progress,
    round,
    leader,
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

  console.log ('saved')
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
      leader,
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

    const log_command = async () =>
      (await client.channels.get (config.log_channel_id))
      .send (`${user_string (message.author)} - ${new Date ().toLocaleTimeString ('en-US')}: ${message.content}`)
    const no_player_error = async () => await send_message (`${is_admin_command ? 'Player has' : 'You have'} not registered for this tournament with !register yet`)

    const announce_pairings = () =>
      A.P.p.iter (async x => {
        if (! x.matchups [0].id) {
          await send_direct_messages ([`The next round has begun. You received a bye.`])
          return
        }
        const opp = A.find (y => y.id === x.matchups [0].id) (joined)
        await send_user_message (x.id, `The next round has begun. You are matched against ${user_string (opp)}`)
        // await images.get_decklist (x.id) (player)
        // await send_user_message (x.id, `Your decklist:`, {files: [`${config.temp_images_path}/${x.id}.jpg`]})
        // await promisify (fs.unlink) (`${config.temp_images_path}/${x.id}.jpg`)
        // await images.get_decklist (x.id) (opp)
        // await send_user_message (x.id, `Your opponent's decklist:`, {files: [`${config.temp_images_path}/${x.id}.jpg`]})
        // await promisify (fs.unlink) (`${config.temp_images_path}/${x.id}.jpg`)
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
      // TODO: calculate mmr and add to match history
      // players = A.map (x => {
      //   const pjoin = A.try_find (y => y.id === x.id) (players)
      //   if (! pjoin) {
      //     return x
      //   }
      //
      // }) (players)

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
    const joined_check = check (NOT_JOINED_ERROR) (A.exists (x => x.id === (player && player.id)) (joined))
    const not_joined_check = check (JOINED_ERROR) (A.for_all (x => x.id !== (player && player.id)) (joined))
    const in_progress_check = check (NOT_IN_PROGRESS_ERROR) (in_progress)
    const not_in_progress_check = check (IN_PROGRESS_ERROR) (! in_progress)
    const playing_check = check (NOT_PLAYING_ERROR) (player && player.playing)

    try {
      switch (command) {
        // !welcome to list the briefing
        case `${config.prefix}welcome`:
          not_in_progress_check ()
          await send_main_messages ([
            `This is the automated tournament bot for CommuniTeam Esports`,
            `All players that would like to participate should register with the bot using !register`,
            `After registering, the bot will work in private messages`,
            `After all players have registered, the tournament leader starts the tournament with !start`,
            `Use !help to get a list of commands and their usages`,
          ])
          return
        // !register to join the day's tournament
        case `${config.prefix}register`:
          not_registered_check ()
          players = [... players, {
            id,
            username: message.author.username,
            discriminator: message.author.discriminator,
            mmr: rules.starting_mmr,
            history: [],
          }]
          await send_direct_messages ([
            `You have been registered for the next automated tournament`,
            `Submit the decks and sideboard that you will be using for this tournament with ${config.prefix}deck and ${config.prefix}sideboard`,
            `Use ${config.prefix}help to get a list of commands and their usages`,
          ])
          await log_command ()
          dirty = true
          return
        // !join to join the next tournament
        case `${config.prefix}join`:
          not_in_progress_check ()
          registered_check ()
          not_joined_check ()
          joined = [... joined, {
            id: player.id,
            team: [],
            decks: [],
            matchups: [],
            playing: true,
            points: 0,
          }]
          await send_direct_messages ([
            `You have joined for the next automated casual tournament`,
            `Read the format rules provided by ${config.prefix}format`,
            `Submit the decks that you will be using for this tournament with ${config.prefix}deck`,
            `Add other players to your team with ${config.prefix}team`,
            `Use ${config.prefix}help to get a list of commands and their usages`,
          ])
          dirty = true
          return
        // set teammates
        case `${config.prefix}team`:
          registered_check ()
          joined_check ()
          not_in_progress_check ()
          // TODO: get users from message mentions
          dirty = true
          return
        // !deck 1-4 to set the deck. no validation, but just ping the player and their partner when the match starts
        case `${config.prefix}deck`:
          registered_check ()
          joined_check ()
          not_in_progress_check ()
          const n = split_message [1]
          if (! S.match (/^([0-9]+)$/) (n) && ~~n >= 1 && ~~n <= rules.number_of_decks && (~~n === 1 || player_entry.decks [n - 2])) {
            await send_message (`Expected deck slot to be between 1 and ${rules.number_of_decks} but was given "${n}"`)
            return
          }
          const url = message.attachments.first ().url
          player_entry.decks [n - 1] = url
          await send_message (`Successfully submit deck ${n}`)
          await send_log_message (`${user_string (message.author)} - ${new Date ().toLocaleTimeString ('en-US')}: ${message.content} ${url}`)
          dirty = true
          return
        // !decklist to provide decklist printout
        case `${config.prefix}decks`:
          registered_check ()
          joined_check ()
          await send_message (`Your submitted decks are:`)
          await A.P.s.iteri (i => async x => x && await send_message (`Deck ${i + 1}: ${x}`)) (player_entry.decks)
          return
        // !status lists out any players that aren't ready and what they are missing
        case `${config.prefix}status`:
          if (! in_progress) {
            await send_message (`There are ${joined.length} players registered for the next tournament`)
            return
          }
          const idle = A.filter (x => ! x.playing) (joined)
          const playing = A.filter (x => x.playing && x.matchups [0].result === 'pending') (joined)
          const won = A.filter (x => x.matchups [0].result === 'win') (joined)
          const lost = A.filter (x => x.matchups [0].result === 'loss') (joined)
          const drew = A.filter (x => x.matchups [0].result === 'draw') (joined)
          const bye = A.filter (x => x.matchups [0].result === 'bye') (joined)
          await send_messages ([
            `The following players are idle:`,
            ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (idle),
            `The following players are playing:`,
            ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (playing),
            `The following players have won their game:`,
            ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (won),
            `The following players have lost their game:`,
            ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (lost),
            `The following players have drawn their game:`,
            ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (drew),
            `The following players received a bye:`,
            ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (bye),
          ])
          return
        // !scoreboard to print out the current scores
        case `${config.prefix}scoreboard`:
          in_progress_check ()
          await print_scoreboard ()
          await log_command ()
          return
        // !leaderboard to print out highest mmr players
        case `${config.prefix}leaderboard`:
          // TODO: prints out top mmr players
          // TODO: option for printing out only players in current tournament
          return
        // !mode picks the tournament mode
        case `${config.prefix}mode`:
          not_in_progress_check ()
          switch (split_message [1]) {
            case 'swiss':
              matchmaker = swiss
              await send_message (`Matchmaking mode has been set to swiss cut`)
              break
            case 'double_elimination':
              matchmaker = double_elim
              await send_message (`Matchmaking mode has been set to double elimination`)
              break
          }
          dirty = true
          return
        // !start closes registration and starts the tournament
        case `${config.prefix}start`:
          if (A.length (joined) <= 1) {
            not_in_progress_check ()
            await send_message (`Not enough players to start a tournament`)
            return
          }
          not_in_progress_check ()
          in_progress = true
          leader = id
          await send_main_message (`The tournament has begun`)
          // begin matchmaking
          round++
          joined = matchmaker (shuffle (joined))
          // send direct message to each participant with their partner and respective decklists
          await announce_pairings ()
          await log_command ()
          dirty = true
          return
        // !next starts the next round of the tournament
        case `${config.prefix}next`:
        case `${config.admin_prefix}next`:
          in_progress_check ()
          if (id !== leader && ! is_admin_command) {
            await (`You are not the tournament organizer`)
            return
          }
          if (A.exists (x => x.matchups [0].result === 'pending') (joined)) {
            const idle = A.filter (x => ! x.playing) (joined)
            const playing = A.filter (x => x.playing && x.matchups [0].result === 'pending') (joined)
            await send_messages ([
              `The following players have not started their game:`,
              ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (idle),
              `The following players have not finished their game:`,
              ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (playing),
            ])
            return
          }
          // begin matchmaking
          round++
          joined = matchmaker (shuffle (A.map (x => ({ ... x, playing: false })) (joined)))
          if (A.for_all (x => x.matchups [0].result === 'bye') (joined)) {
            await cleanup ()
            return
          }
          await print_scoreboard ()
          await send_main_message (`The next round of the tournament has begun`)
          // send direct message to each participant with their partner and respective decklists
          await announce_pairings ()
          await log_command ()
          dirty = true
          return
        // !play signals that the match for the player and their partner has started so the bot can nag people that haven't started their game
        case `${config.prefix}play`:
          // add player to active players
          registered_check ()
          joined_check ()
          in_progress_check ()
          A.find (x => x.id === player.id) (joined).playing = true
          await send_messages ([
            `You have been marked as present`,
            `Once the set is over, report the match result with ${config.prefix}win, ${config.prefix}loss, or ${config.prefix}draw`,
          ])
          await log_command ()
          dirty = true
          return
        // !win/!loss/!draw to report the result
        case `${config.prefix}win`:
        case `${config.admin_prefix}win`:
          // records win result
          registered_check ()
          joined_check ()
          in_progress_check ()
          playing_check ()
          record_win (player)
          await send_messages ([
            `Your win has been recorded`,
            `Wait for the next round to begin`,
          ])
          await send_user_message (player.matchups [0].id, `Your opponent has recorded a loss for you`)
          await log_command ()
          dirty = true
          return
        case `${config.prefix}loss`:
        case `${config.admin_prefix}loss`:
          // records loss result
          registered_check ()
          joined_check ()
          in_progress_check ()
          playing_check ()
          record_loss (player)
          await send_messages ([
            `Your loss has been recorded`,
            `Wait for the next round to begin`,
          ])
          await send_user_message (player.matchups [0].id, `Your opponent has recorded a win for you`)
          await log_command ()
          dirty = true
          return
        case `${config.prefix}draw`:
        case `${config.admin_prefix}draw`:
          // records win result
          registered_check ()
          joined_check ()
          in_progress_check ()
          playing_check ()
          record_draw (player)
          await send_messages ([
            `Your draw has been recorded`,
            `Wait for the next round to begin`,
          ])
          await send_user_message (player.matchups [0].id, `Your opponent has recorded a draw for you`)
          await log_command ()
          dirty = true
          return
        // !score to view your current score
        case `${config.prefix}score`:
        case `${config.admin_prefix}score`:
          registered_check ()
          joined_check ()
          in_progress_check ()
          const scored = score (player)
          players = [
            ... A.filter (x => x.id !== id) (players),
            scored,
          ]
          const win = A.length (A.filter (x => x.result === 'win') (scored.matchups))
          const loss = A.length (A.filter (x => x.result === 'loss') (scored.matchups))
          const draw = A.length (A.filter (x => x.result === 'draw') (scored.matchups))
          await send_message (`${scored.username}#${scored.discriminator} [ ${scored.points} points | ${win} W - ${loss} L - ${draw} D ]`)
          return
        // !drop to leave the tournament
        case `${config.prefix}drop`:
        case `${config.admin_prefix}drop`:
          registered_check ()
          joined_check ()
          A.find (x => x.id === player.id) (joined).matchups [0].result === 'pending' && record_drop (player)
          if (in_progress) {
            dropped = [... dropped, player]
          }
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} been dropped from this tournament`)
          if (! is_admin_command) {
            await send_user_message (id, `You have been dropped from this tournament`)
          }
          await log_command ()
          dirty = true
          return
        // !end to end the tournament
        case `${config.prefix}end`:
        case `${config.admin_prefix}end`:
          in_progress_check ()
          if (id !== leader && ! is_admin_command) {
            await (`You are not the tournament organizer`)
            return
          }
          if (A.exists (x => x.matchups [0].result === 'pending') (joined)) {
            const idle = A.filter (x => ! x.playing) (joined)
            const playing = A.filter (x => x.playing && x.matchups [0].result === 'pending') (joined)
            await send_messages ([
              `The following players have not started their game:`,
              ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (idle),
              `The following players have not finished their game:`,
              ... A.map (F.c () (D.get ('id') >> get_player_by_id >> user_string)) (playing),
            ])
            return
          }
          await cleanup ()
          await log_command ()
          dirty = true
          return
        // !delegate to pass tournament leadership
        case `${config.prefix}delegate`:
        case `${config.admin_prefix}delegate`:
          if (id !== leader && ! is_admin_command) {
            await (`You are not the tournament organizer`)
            return
          }
          leader = split_message [is_admin_command ? 2 : 1]
          await send_message (`The new tournament organizer has been chosen`)
          await log_command ()
          dirty = true
          return
        // !mmr to set mmr
        case `${config.admin_prefix}mmr`:
          player.mmr = ~~ split_message [1]
          await send_message (`The MMR for ${player.id} has been set to ${split_message [1]}`)
          dirty = true
          return
        // !help list available commands
        case `${config.prefix}help`: {
          if (is_admin) {
            await send_message (`Commands with an admin version can be used by using the ${config.admin_prefix} admin prefix and using the player's id as the first argument`)
          }
          // TODO: add new commands
          await F.p ([{
            check: ! in_progress,
            command: `welcome`,
            effect: `print out the initial explanation of the bot`,
          }, {
            check: ! in_progress,
            command: `register`,
            effect: `sign up for the next tournament`,
          }, {
            check: ! in_progress,
            command: `team <@user>`,
            effect: `add another player to your team`,
          }, {
            check: ! in_progress,
            command: `deck <slot> </cud>`,
            effect: `submit a deck in the chosen slot, taking the /cud deck format from the game client`,
          }, {
            command: `decks`,
            effect: `review your submitted decks`,
          }, {
            command: `status`,
            effect: `print out the current status of each player in the tournament`,
          }, {
            check: in_progress,
            command: `scoreboard`,
            effect: `prints out the scores for the current tournament`,
          }, {
            check: in_progress,
            command: `leaderboard`,
            effect: `prints out a list of the top rated players`,
          }, {
            check: ! in_progress,
            command: `mode <swiss|double_elimination>`,
            effect: `sets the format for the next tournament`,
          }, {
            check: ! in_progress && id === leader,
            command: `start`,
            effect: `begin the tournament and designate the user of this command as the tournament organizer`,
          }, {
            check: in_progress && id === leader,
            command: `next`,
            effect: `begin the next round in the tournament unless there are players that are not ready`,
            has_admin_version: true,
          }, {
            check: in_progress,
            command: `play`,
            effect: `mark yourself as having begun your match against your opponent`,
          }, {
            check: in_progress,
            command: `win`,
            effect: `report that you won your match`,
            has_admin_version: true,
          }, {
            check: in_progress,
            command: `loss`,
            effect: `report that you lost your match`,
            has_admin_version: true,
          }, {
            check: in_progress,
            command: `draw`,
            effect: `report that you drew your match`,
            has_admin_version: true,
          }, {
            check: in_progress,
            command: `score`,
            effect: `shows your current score for the tournament`,
          }, {
            command: `drop`,
            effect: `withdraw from the tournament`,
            has_admin_version: true,
          }, {
            check: in_progress && id === leader,
            command: `end`,
            effect: `end the tournament and print out the scoreboard`,
            has_admin_version: true,
          }, {
            check: id === leader,
            command: `delegate <id>`,
            effect: `designate the target of the command as the new tournament organizer using their discord id`,
            has_admin_version: true,
          }, {
            command: `help`,
            effect: `Hint: you just used it`,
          }]) (
            A.filter (x => x.check || is_admin)
            >> A.map (({
              check = true,
              command,
              effect,
              has_admin_version = false,
            }) => [
              `Command: ${config.prefix}${command}`,
              `Effect: ${effect}`,
              ... (has_admin_version && is_admin ? [`This command has an admin version`] : [])
            ])
            >> A.fold (A.append) ([])
            >> send_messages
          )
          return
        }
      }
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
        default:
          await send_message ('There was an error processing your request')
          await send_dev_messages ([err.message, err.stack])
          return
      }
    }
  })

  client.login (config.bot_token)

  F.log ('Start expending mana! Go, go, go!')
}) ()
