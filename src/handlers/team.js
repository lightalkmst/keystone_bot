// !team to set teammates
module.exports = async ({
  messaging: {
    send_messages
  },
  info: {
    message,
    player_entry,
  },
  util: {
    user_string_by_id,
  },
  checks: {
    registered_check,
    joined_check,
    not_in_progress_check,
  },
}) => {
  // TODO: does captain check fit here?
  registered_check ()
  joined_check ()
  not_in_progress_check ()
  // team size check
  if (player_entry.team.length >= rules.players_per_team - 1) {
    await send_message (`Exceeded number of players per team: ${rules.players_per_team}`)
    return
  }
  // mention check
  if (! message.mentions.users.array () [0]) {
    await send_message (`Expected a user mention but was not given one`)
    return
  }
  // mentioned user registered check
  if (! A.exists (x => x.id === message.mentions.users.array () [0].id) (players)) {
    await send_message (`User has not registered in the bot yet`)
    return
  }
  // mentioned user already joined tournament check
  if (A.exists (x => x.id === message.mentions.users.array () [0].id || A.contains (message.mentions.users.array () [0].id) (x.team)) (joined)) {
    await send_message (`That player has already joined the tournament and may not join a team unless they drop`)
    return
  }
  player_entry.team = [... player_entry.team, message.mentions.users.array () [0].id]
  await send_messages ([
    `Your team is:`,
    user_string_by_id (player_entry.id),
    ... A.map (user_string_by_id) (player_entry.team),
  ])
  dirty = true
}
