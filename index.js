module.exports = process.env.HSF_COV ? require('./lib-cov/forwards') : require('./lib/forwards');
