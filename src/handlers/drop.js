// !drop to leave the tournament
module.exports = async ({
  messaging: {
    send_message,
    log_command,
  },
  info: {
    in_progress,
    player,
    is_admin_command,
  },
  util,
  checks: {
    captain_check,
    registered_check,
    joined_check,
  },
}) => {
  captain_check ()
  registered_check ()
  joined_check ()
  // TODO: drop mentioned user from team
  // TODO: remove deck for dropped user's index
  if (in_progress) {
    A.find (x => x.id === player.id) (joined).matchups [0].result === 'pending' && record_drop (player)
    dropped = [... dropped, player]
  }
  else {
    joined = A.filter (x => x.id !== player.id) (joined)
  }
  await send_message (`${is_admin_command ? 'Player has' : 'You have'} been dropped from this tournament`)
  await log_command ()
  dirty = true
}
