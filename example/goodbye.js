exports.handler = function(event, context, cb) {
  cb(null, JSON.stringify({good: 'bye'}))
}
