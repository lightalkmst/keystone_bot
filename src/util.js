const get_player_by_id = id => A.try_find (x => x.id === id) (players)

const user_string = u => `${u.username}#${u.discriminator}`
const user_string_by_id = async id => user_string (await client.fetchUser (id))

const get_team_mmr = joined => A.fold (F ['+']) (0) (A.map (get_player_by_id) ([joined.id, ... joined.team]))

// seeds according to mmr ratings
const seed = joined => {
  const joined2 = A.sort (x => y => get_team_mmr (x) - get_team_mmr (y)) (joined)
  const joined3 = A.create (Math.pow (2, Math.ceil (Math.log2 (joined2.length)))) (null)
  for (const i in joined2) {
    const p = joined2 [i]
    joined3 [i < joined3.length / 2 ? i * 2 : joined3.length - (i - joined3.length / 2) * 2 - 1] = p
  }
  return players3
}

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

const create_messaging_utils = client => message => {
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

  const user_id = message.author.id

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

  // TODO: figure out a better place for this since it's side-effecting
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

  return {
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
    announce_pairings,
    print_scoreboard,
    cleanup,
  }
}

module.exports = {
  get_player_by_id,
  user_string,
  user_string_by_id,
  get_team_mmr,
  seed,
  score,
  record_match,
  shuffle,
  create_messaging_utils,
}
