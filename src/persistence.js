const AWS = require ('aws-sdk')
const S3 = new AWS.S3 (require ('../credentials'))

const double_elim = require ('./matchmakers/double_elimination')
const swiss = require ('./matchmakers/swiss')

global.dirty = false

const save_state = async () => {
  if (! dirty) {
    return
  }

  const state = {
    in_progress,
    round,
    players,
    joined,
    dropped,
    brackets,
    matchmaker: matchmaker === swiss ? 'swiss' : 'double_elimination',
  }

  try {
    await S3.upload ({
      Bucket: config.bucket_name,
      Key: config.state_file_name,
      Body: JSON.stringify (state, null, 2),
    })
    .promise ()
    dirty = false
  }
  catch (err) {
    console.log ('err:', err.message)
  }
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

module.exports = {
  save_state,
  load_state,
}
