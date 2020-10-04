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
  util: {
    record_match,
  },
  checks: {
    captain_check,
    registered_check,
    joined_check,
  },
}) => {
  captain_check ()
  registered_check ()
  joined_check ()
  if (in_progress) {
    A.find (x => x.id === player.id) (joined).matchups [0].result === 'pending' && record_match ('drop') (player)
    dropped = [... dropped, player]
  }
  else {
    joined = A.filter (x => x.id !== player.id) (joined)
  }
  await send_message (`${is_admin_command ? 'Player has' : 'You have'} been dropped from this tournament`)
  await log_command ()
  dirty = true
}
