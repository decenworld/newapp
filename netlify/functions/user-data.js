const faunadb = require('faunadb');
const q = faunadb.query;

const client = new faunadb.Client({ secret: process.env.FAUNA_SECRET_KEY });

exports.handler = async (event, context) => {
  const { httpMethod, body } = event;
  const { telegram_id } = JSON.parse(body);

  try {
    switch (httpMethod) {
      case 'GET':
        const result = await client.query(
          q.Get(q.Match(q.Index('user_data_by_telegram_id'), telegram_id))
        );
        return { statusCode: 200, body: JSON.stringify(result.data) };

      case 'POST':
        const { game_state } = JSON.parse(body);
        await client.query(
          q.Let(
            {
              match: q.Match(q.Index('user_data_by_telegram_id'), telegram_id)
            },
            q.If(
              q.Exists(q.Var('match')),
              q.Update(q.Select('ref', q.Get(q.Var('match'))), { data: { game_state, last_updated: q.Now() } }),
              q.Create(q.Collection('user_data'), { data: { telegram_id, game_state, last_updated: q.Now() } })
            )
          )
        );
        return { statusCode: 200, body: JSON.stringify({ message: 'Data saved successfully' }) };

      default:
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
