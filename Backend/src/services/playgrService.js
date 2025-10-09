const { findPlaygroundsByKeyword } = require('../queries/playgr');

async function searchPlaygrounds(keyword) {
  return await findPlaygroundsByKeyword(keyword);
}

module.exports = { searchPlaygrounds };
