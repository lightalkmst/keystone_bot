// !decklist to provide decklist printout
module.exports = async ({
  messaging: {
    send_message,
  },
  info: {
    captain,
  },
  util,
  checks: {
    registered_check,
    joined_check,
  },
}) => {
  registered_check ()
  joined_check ()
  await send_message (`Your submitted decks are:`)
  // discord loads url images after the message in order, but has a limit per message, so send an individual message per deck
  await A.P.s.iteri (i => async x => x && await send_message (`Deck ${i + 1}: ${x}`)) (captain.decks)
}
