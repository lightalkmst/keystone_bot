const Discord = require ('discord.js')
const client = new Discord.Client ()
const fs = require ('fs')
const edmondsBlossom = require ('edmonds-blossom')
const { promisify } = require ('util')

require ('green_curry') (['globalize', 'short F.c'])

const cards = require ('./cards')
const masters = require ('./masters')

const config = require ('./config')
const rules = config.rules

const images = require ('./src/utils/images')
const validation = require ('./src/utils/validation')

// TODOS
// !status count number of players in the tournament
// !score to check current personal score during a tournament
// !validate should make sure that the cards are in the valid deck
// prompt user with messages at each step
// fix validation error messages
// omit master from sideboard

const REGISTERED_ERROR = {}
const NOT_REGISTERED_ERROR = {}
const IN_PROGRESS_ERROR = {}
const NOT_IN_PROGRESS_ERROR = {}
const NOT_PLAYING_ERROR = {}

let in_progress = false
let round = 1
let players =
  [
    // {
    //   id: '155333141458976768',
    //   username: 'Thighlander',
    //   discriminator: '0671',
    //   deck1: 'KingPuff: OnceBitten, GatlingBike, DroneWalker, Fireball, BurstCannon, SwarmerKing, PropellerHorde, SniperSquad, SoulStealer, BlueGolem',
    //   deck2: 'Volco: NetherBat, ScreamingScrat, EliteSwarmer, PropellerScrats, DragonWhelp, Owls, BatSwarm, ShieldedCrossbowDudes, DivineWarrior, Cleaver',
    //   deck3: 'Settsu: BannerMan, CrystalMage, SnakeDruid, SniperScrat, SwarmerKing, Musketeer, Blastmancer, DefensoChopper, ScratStorm, Cleaver',
    //   deck4: 'Stormbringer: ScreamingScrat, CrossbowDudes, BannerMan, PlasmaMarines, SniperScrat, XiaoLong, BountySniper, FireImp, SniperSquad, Styxi',
    //   sideboard: 'NetherBat, ScreamingScrat, FireImp, Fireball, ClippedDragonWhelps, ScratTank, ScratStorm',
    //   matchups: [],
    //   playing: false,
    //   points: 0
    // },
    // {
    //   id: '278588414360551424',
    //   username: 'salbei',
    //   discriminator: '0483',
    //   deck1: 'Settsu: BannerMan, CrystalMage, SnakeDruid, SniperScrat, SwarmerKing, Musketeer, Blastmancer, DefensoChopper, ScratStorm, Cleaver',
    //   deck2: 'Stormbringer: ScreamingScrat, CrossbowDudes, BannerMan, PlasmaMarines, SniperScrat, XiaoLong, BountySniper, FireImp, SniperSquad, Styxi',
    //   deck3: 'KingPuff: OnceBitten, GatlingBike, DroneWalker, Fireball, BurstCannon, SwarmerKing, PropellerHorde, SniperSquad, SoulStealer, BlueGolem',
    //   deck4: 'Volco: NetherBat, ScreamingScrat, EliteSwarmer, PropellerScrats, DragonWhelp, Owls, BatSwarm, ShieldedCrossbowDudes, DivineWarrior, Cleaver',
    //   sideboard: 'NetherBat, ScreamingScrat, FireImp, Fireball, ClippedDragonWhelps, ScratTank, ScratStorm',
    //   matchups: [],
    //   playing: false,
    //   points: 0
    // },
  ]

let dropped = []
let leader = null

const is_cud = S.match (/^[a-zA-Z]*: ([a-zA-Z0-9-]+, ){0,9}[a-zA-Z0-9-]+$/)
const is_sideboard = S.match (/^([a-zA-Z]*: |)([a-zA-Z0-9-]+, ){0,9}([a-zA-Z0-9-]+)$/)

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

  // var possiblePairs = []
  // availablePlayers.forEach(player => {
  //   availablePlayers.forEach(opponent => {
  //     if (player.playerIndex !== opponent.playerIndex) {
  //       var match = [player.playerIndex, opponent.playerIndex]
  //       match.sort((a, b) => a - b)
  //       if (player.opponents.indexOf(opponent.playerIndex) === -1) {
  //         match.push(maxDiff - Math.abs(player.points - opponent.points))
  //       }
  //       else {
  //         match.push(0)
  //       }
  //       if (this.searchForArray(possiblePairs, match) === -1) {
  //         possiblePairs.push(match)
  //       }
  //     }
  //   })
  // })
  //
  // var rawPairing = edmondsBlossom(possiblePairs)
  // rawPairing.forEach((match, index) => {
  //   if (match !== -1 && match < index) {
  //     round.matches.push({
  //       home: match,
  //       home_score: '',
  //       away: index,
  //       away_score: '',
  //       referee: -1
  //     })
  //   }
  // })
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
          .default (() => 0) // TODO: switch to end
        )
        >> A.fold (F ['+']) (0)
      )
    ,
  }

const record_match = result => p => ({
  ... p,
  matchups: [{
    ... A.head (p.matchups),
    result,
  }, ... A.tail (p.matchups)],
  playing: true,
  points: undefined,
})
const record_win = record_match ('win')
const record_draw = record_match ('draw')
const record_loss = record_match ('loss')
const record_bye = record_match ('bye')

;(async () => {
  client.on ('ready',  () => {
    const activities = [
      'Minion Masters',
      'with Stormbringer',
      'with Settsu',
      'with Ratbo',
      'with Milloween',
      'with Diona',
      'with Ruffles',
      'with Ravager',
      'with Brutus',
      'with TERROR BRUTUS',
      'with King Puff',
      'with Mordar',
      'with Apep',
      'the bagpipes',
      'with Morellia',
      'with Nyrvir',
      'with Jolo',
      'with Caeleth',
      'with Scott',
      'with Leiliel',
      'with Morgrul',
    ]
    const set_activity = () =>
      F.try (() => client.user.setActivity (activities [Math.floor (masters.length * Math.random ())]))
      .catch (F.log)
    set_activity ()
    setInterval (set_activity, 1000 * 60 * 3)
  })

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
    const opponent_id = (((player || {}).matchups || {}) [0] || {}).id

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
        const opp = A.find (y => y.id === x.matchups [0].id) (players)
        await send_user_message (x.id, `The next round has begun. You are matched against ${user_string (opp)}`)
        await images.get_decklist (x.id) (player)
        await send_user_message (x.id, `Your decklist:`, {files: [`${config.temp_images_path}/${x.id}.jpg`]})
        await promisify (fs.unlink) (`${config.temp_images_path}/${x.id}.jpg`)
        await images.get_decklist (x.id) (opp)
        await send_user_message (x.id, `Your opponent's decklist:`, {files: [`${config.temp_images_path}/${x.id}.jpg`]})
        await promisify (fs.unlink) (`${config.temp_images_path}/${x.id}.jpg`)
      }) (players)

    const print_scoreboard = async () => {
      const compare = x => y => y.points - x.points // descending
      players = A.sort (compare) (A.map (score) (players))
      dropped = A.sort (compare) (A.map (score) (dropped))
      await send_main_message (`The current standings:`)
      await A.P.s.iteri (i => async x => {
        const win = A.length (A.filter (y => y.result === 'win') (x.matchups))
        const loss = A.length (A.filter (y => y.result === 'loss') (x.matchups))
        const drew = A.length (A.filter (y => y.result === 'draw') (x.matchups))
        await send_main_message (`${i + 1}) ${x.username}#${x.discriminator} [ ${x.points} points | ${win} W - ${loss} L - ${drew} D ]`)
      }) (players)
      await A.P.s.iteri (i => async x => {
        const win = A.length (A.filter (y => y.result === 'win') (x.matchups))
        const loss = A.length (A.filter (y => y.result === 'loss') (x.matchups))
        const drew = A.length (A.filter (y => y.result === 'draw') (x.matchups))
        await send_main_message (`${i + 1}) ${x.username}#${x.discriminator} [ ${x.points} points | ${win} W - ${loss} L - ${drew} D ] (dropped)`)
      }) (dropped)
    }

    const check = e => c => () => {
      if (! c) {
        throw e
      }
    }
    const registered_check = check (NOT_REGISTERED_ERROR) (player)
    const not_registered_check = check (REGISTERED_ERROR) (! player)
    const in_progress_check = check (NOT_IN_PROGRESS_ERROR) (in_progress)
    const not_in_progress_check = check (IN_PROGRESS_ERROR) (! in_progress)
    const playing_check = check (NOT_PLAYING_ERROR) (player && player.playing)

    try {
      switch (command) {
        // !welcome to list the briefing
        case `${config.prefix}welcome`:
          not_in_progress_check ()
          await send_main_messages ([
            `This is the automated casual tournament bot for The Challenger League`,
            `You can use it to arrange practice tournaments with other players`,
            `All players that would like to participate should register with the bot using !register`,
            `After registering, the bot will work in private messages`,
            `After all players have registered, the tournament leader starts the tournament with !start`,
            `Use !help to get a list of commands and their usages`,
          ])
          return
        // !register to join the day's tournament
        case `${config.prefix}register`:
          not_in_progress_check ()
          not_registered_check ()
          players = [... players, {
            id,
            username: message.author.username,
            discriminator: message.author.discriminator,
            deck1: '',
            deck2: '',
            deck3: '',
            deck4: '',
            sideboard: '',
            matchups: [], // matches are in newest first order
            playing: false,
            points: 0,
          }]
          await send_direct_messages ([
            `You have been registered for the next automated casual tournament`,
            `Use !help to get a list of commands and their usages`,
          ])
          await log_command ()
          return
        // !deck 1-4 to set the deck. no validation, but just ping the player and their partner when the match starts
        case `${config.prefix}deck`:
          registered_check ()
          not_in_progress_check ()
          const n = split_message [1]
          if (! S.match (/^([0-9]+)$/) (n)) {
            await send_message (`Expected deck slot to be between 1 and ${rules.number_of_decks} but was given "${n}"`)
            return
          }
          const deck = F.c (A.tail >> A.tail >> S.join (' ')) (split_message)
          if (! is_cud (deck)) {
            await send_message (`Expected deck to be in /cud format but was given "${deck}"`)
            return
          }
          players = [
            ... A.filter (x => x.id !== id) (players),
            {
              ... A.find (x => x.id === id) (players),
              [`deck${n}`]: deck,
            },
          ]
          await images.get_deck (id) (deck)
          await send_message (`Successfully submit deck ${n}:`, {files: [`${config.temp_images_path}/${id}.jpg`]})
          await promisify (fs.unlink) (`${config.temp_images_path}/${id}.jpg`)
          await log_command ()
          return
        // !sideboard same thing
        case `${config.prefix}sideboard`:
          registered_check ()
          not_in_progress_check ()
          const sideboard = F.c (A.tail >> S.join (' ')) (split_message)
          if (! is_sideboard (sideboard)) {
            await send_message (`Expected sideboard to be in /cud format but was given "${sideboard}"`)
          }
          players = [
            ... A.filter (x => x.id !== id) (players),
            {
              ... A.find (x => x.id === id) (players),
              sideboard,
            },
          ]
          await images.get_sideboard (id) (sideboard)
          await send_message (`Successfully submit sideboard:`, {files: [`${config.temp_images_path}/${id}.jpg`]})
          await promisify (fs.unlink) (`${config.temp_images_path}/${id}.jpg`)
          await log_command ()
          return
        // !decklist to provide decklist printout
        case `${config.prefix}decklist`:
          registered_check ()
          await images.get_decklist (id) (player)
          await send_message (`Current decklist:`, {files: [`${config.temp_images_path}/${id}.jpg`]})
          await promisify (fs.unlink) (`${config.temp_images_path}/${id}.jpg`)
          return
        // !validate to validate a deck loadout
        case `${config.prefix}validate`:
          // TODO: images for validations
          if (split_message.length > 1) {
            const errors = validation.validate_deck (S.join (' ') (A.tail (split_message)))
            if (errors.length) {
              await send_messages ([`This deck has the following errors:`, ... errors])
              return
            }
            await send_message (`This deck is valid`)
            return
          }
          registered_check ()
          await images.get_decklist (id) (player)
          await send_message (`Current decklist:`, {files: [`${config.temp_images_path}/${id}.jpg`]})
          await promisify (fs.unlink) (`${config.temp_images_path}/${id}.jpg`)
          const errors = validation.validate_decks (player)
          if (errors.length) {
            await send_messages ([`This decklist has the following errors:`, ... errors])
            return
          }
          await send_message (`This decklist is valid`)
          return
        // !status lists out any players that aren't ready and what they are missing
        case `${config.prefix}status`:
          if (! in_progress) {
            const errors =
              F.p (players) (
                A.map (x => ({
                  player: x,
                  errors: validation.validate_decks (x),
                }))
                >> A.filter (x => x.errors.length)
              )
            if (! errors.length) {
              await send_message (`All players have valid decklists`)
              return
            }
            await A.P.s.iter (async ({player, errors}) => {
              await send_messages ([`${user_string (player)} has the following decklist errors:`, ... errors])
            }) (errors)
            return
          }
          const idle = A.filter (x => ! x.playing) (players)
          const playing = A.filter (x => x.playing && x.matchups [0].result === 'pending') (players)
          const won = A.filter (x => A.contains (x.matchups [0].result) (['win', 'bye'])) (players)
          const lost = A.filter (x => x.matchups [0].result === 'loss') (players)
          const drew = A.filter (x => x.matchups [0].result === 'draw') (players)
          await send_messages ([
            `The following players are idle:`,
            ... A.map (user_string) (idle),
            `The following players are playing:`,
            ... A.map (user_string) (playing),
            `The following players have won their game:`,
            ... A.map (user_string) (won),
            `The following players have lost their game:`,
            ... A.map (user_string) (lost),
            `The following players have drawn their game:`,
            ... A.map (user_string) (drew),
          ])
          return
        // !scoreboard to print out the current scores
        case `${config.prefix}scoreboard`:
          in_progress_check ()
          await print_scoreboard ()
          await log_command ()
          return
        // !start closes registration and starts the tournament
        case `${config.prefix}start`:
          if (A.length (players) <= 1) {
            await send_message (`Not enough players to start a tournament`)
            return
          }
          not_in_progress_check ()
          in_progress = true
          leader = id
          await send_message (`The tournament has begun`)
          // begin matchmaking
          round++
          players = swiss (shuffle (players))
          // send direct message to each participant with their partner and respective decklists
          await announce_pairings ()
          await log_command ()
          return
        // !next starts the next round of the tournament
        case `${config.prefix}next`:
        case `${config.admin_prefix}next`:
          in_progress_check ()
          if (id !== leader && ! is_admin_command) {
            await (`You are not the tournament organizer`)
            return
          }
          if (A.exists (x => x.matchups [0].result === 'pending') (players)) {
            const idle = A.filter (x => ! x.playing) (players)
            const playing = A.filter (x => x.playing && x.matchups [0].result === 'pending') (players)
            await send_messages ([
              `The following players have not started their game:`,
              ... A.map (user_string) (idle),
              `The following players have not finished their game:`,
              ... A.map (user_string) (playing),
            ])
            return
          }
          // begin matchmaking
          round++
          players = swiss (shuffle (A.map (x => ({ ... x, playing: false })) (players)))
          await print_scoreboard ()
          // send direct message to each participant with their partner and respective decklists
          await announce_pairings ()
          await log_command ()
          return
        // !play signals that the match for the player and their partner has started so the bot can nag people that haven't started their game
        case `${config.prefix}play`:
          // add player to active players
          registered_check ()
          in_progress_check ()
          players = [
            ... A.filter (x => x !== player) (players),
            {
              ... player,
              playing: true,
            },
          ]
          await send_message (`You have been marked as present`)
          await log_command ()
          return
        // !win/!loss/!draw to report the result
        case `${config.prefix}win`:
        case `${config.admin_prefix}win`:
          // records win result
          registered_check ()
          in_progress_check ()
          playing_check ()
          players = [
            ... A.filter (x => x.id !== id && x.id !== opponent_id) (players),
            record_win (player),
            record_loss (A.find (x => x.id === opponent_id) (players)),
          ]
          await send_message (`Your win has been recorded`)
          await send_user_message (player.matchups [0].id, `Your opponent has recorded a loss for you`)
          await log_command ()
          return
        case `${config.prefix}loss`:
        case `${config.admin_prefix}loss`:
          // records loss result
          registered_check ()
          in_progress_check ()
          playing_check ()
          players = [
            ... A.filter (x => x.id !== id && x.id !== opponent_id) (players),
            record_loss (player),
            record_win (A.find (x => x.id === opponent_id) (players)),
          ]
          await send_message (`Your loss has been recorded`)
          await send_user_message (player.matchups [0].id, `Your opponent has recorded a win for you`)
          await log_command ()
          return
        case `${config.prefix}draw`:
        case `${config.admin_prefix}draw`:
          // records win result
          registered_check ()
          in_progress_check ()
          playing_check ()
          players = [
            ... A.filter (x => x.id !== id && x.id !== opponent_id) (players),
            record_win (player),
            record_loss (A.find (x => x.id === opponent_id) (players)),
          ]
          await send_message (`Your draw has been recorded`)
          await send_user_message (player.matchups [0].id, `Your opponent has recorded a draw for you`)
          await log_command ()
          return
        // !drop to leave the tournament
        case `${config.prefix}drop`:
        case `${config.admin_prefix}drop`:
          registered_check ()
          players = [
            ... A.filter (x => x.id !== id && x.id !== opponent_id) (players),
            ... (opponent_id ? [record_bye (A.find (x => x.id === opponent_id) (players))] : []),
          ]
          dropped = [... dropped, player]
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} been dropped from this tournament`)
          // TODO: award win to opponent
          await log_command ()
          return
        // !end to end the tournament
        case `${config.prefix}end`:
        case `${config.admin_prefix}end`:
          in_progress_check ()
          if (id !== leader && ! is_admin_command) {
            await (`You are not the tournament organizer`)
            return
          }
          if (A.exists (x => x.matchups [0].result === 'pending') (players)) {
            const idle = A.filter (x => ! x.playing) (players)
            const playing = A.filter (x => x.playing && x.matchups [0].result === 'pending') (players)
            await send_messages ([
              `The following players have not started their game:`,
              ... A.map (user_string) (idle),
              `The following players have not finished their game:`,
              ... A.map (user_string) (playing),
            ])
            return
          }
          await send_message (`The tournament has been ended`)
          await print_scoreboard ()
          await send_message (`Please use ${config.prefix}welcome in the public bot channel after any further tournament conclusions`)
          in_progress = false
          round = 1
          players = []
          dropped = []
          await log_command ()
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
          return
        // list available commands
        case `${config.prefix}help`: {
          if (is_admin) {
            await send_message (`Commands with an admin version can be used by using the ${config.admin_prefix} admin prefix and using the player's id as the first argument`)
          }
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
            command: `deck <slot> </cud>`,
            effect: `submit a deck in the chosen slot, taking the /cud deck format from the game client`,
          }, {
            check: ! in_progress,
            command: `sideboard </cud>`,
            effect: `submit a sideboard, taking the /cud deck format from the game client`,
          }, {
            command: `decklist`,
            effect: `print out the current decklist and any errors`,
          }, {
            command: `validate </cud>`,
            effect: `check the deck for any errors`,
          }, {
            command: `status`,
            effect: `print out the current status of each player in the tournament`,
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
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} already registered for the tournament`)
          return
        case NOT_REGISTERED_ERROR:
          await send_message (`${is_admin_command ? 'Player has' : 'You have'} not registered for this tournament with !register yet`)
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
