// !join to join the next tournament
module.exports = async ({
  messaging: {
    send_direct_messages,
  },
  info: {
    player,
  },
  util,
  checks: {
    not_in_progress_check,
    registered_check,
    not_joined_check,
  },
}) => {
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
    `You have joined the next automated casual tournament`,
    `Submit the decks that your team will be using for this tournament with ${config.prefix}deck`,
    `Add other players to your team with ${config.prefix}team`,
    `Use ${config.prefix}help to get a list of commands and their usages`,
  ])
  dirty = true
}
