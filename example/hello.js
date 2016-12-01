exports.handler = function(event, context, cb) {
  cb(null, JSON.stringify({ hello: event.name || 'world' }))
}
