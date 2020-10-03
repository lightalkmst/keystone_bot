// !deck 1-4 to set the deck. no validation, but just ping the player and their partner when the match starts
module.exports = async ({
  messaging: {
    send_message,
    send_log_message,
  },
  info: {
    message,
    n,
    player_entry,
  },
  util: {
    user_string,
  },
  checks: {
    captain_check,
    registered_check,
    joined_check,
    not_in_progress_check,
  },
}) => {
  captain_check ()
  registered_check ()
  joined_check ()
  not_in_progress_check ()
  if (! S.match (/^([0-9]+)$/) (n) && ~~n >= 1 && ~~n <= rules.number_of_decks && (~~n === 1 || player_entry.decks [n - 2])) {
    await send_message (`Expected deck slot to be between 1 and ${rules.number_of_decks} but was given "${n}"`)
    return
  }
  const url = message.attachments.first ().url
  player_entry.decks [n - 1] = url
  await send_message (`Successfully submit deck ${n}`)
  await send_log_message (`${user_string (message.author)} - ${new Date ().toLocaleTimeString ('en-US')}: ${message.content} ${url}`)
  dirty = true
}
