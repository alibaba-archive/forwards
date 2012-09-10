module.exports = process.env.FORWARDS_COV ? require('./lib-cov/forwards') : require('./lib/forwards');
