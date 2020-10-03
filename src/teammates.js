module.exports = async ({
  messaging: {
    send_messages,
  },
  info,
  util: {
    user_string_by_id,
  },
  checks: {
    registered_check,
    joined_check,
  },
}) => {
  registered_check ()
  joined_check ()
  await send_messages ([
    `Your team is:`,
    user_string_by_id (captain.id),
    ... A.map (user_string_by_id) (captain.team),
  ])
}
