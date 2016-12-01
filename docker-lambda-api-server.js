#!/usr/bin/env node
'use strict'

var args = require('args') 
var path = require('path')
var yaml = require('js-yaml')
var fs = require('fs')
var http = require('http') 
var lambdaInvoke = require('docker-lambda')

var DEFAULT_PORT = 3000
var DEFAULT_FUNCTION_PATH = '.'
var AWS_LAMBDA_API_URL_REGEX = /^\/\d{4}-\d{2}-\d{2}\/functions\/(.+?)\/invocations/

args
  .option(['h', 'help'], 'Show usage information')
  .option(['p', 'port'], 'Port on which the API server will be running', DEFAULT_PORT)
  .option(['P', 'path'], 'Path to the function handler scripts', DEFAULT_FUNCTION_PATH)
  .option(['f', 'file'], 'AWS SAM template file')
  .option(['v', 'verbose'], 'Verbose output')

var opts = args.parse(process.argv, { help: false, version: false })

if (!opts.file) {
  return args.showHelp()
}

var functionsDir = path.resolve(process.cwd(), opts.path)
var doc = yaml.safeLoad(fs.readFileSync(opts.file, 'utf8'))

// TODO: improve -- quick & dirty filtering
var functions = Object.keys(doc.Resources)
  .filter(name => 
    doc.Resources[name].Type === 'AWS::Serverless::Function'
    &&
    doc.Resources[name].Properties.Runtime.indexOf('nodejs') >= 0
  )
  .reduce((obj, name) => {
    obj[name] = doc.Resources[name].Properties.Handler
    return obj
  }, {})

http.createServer(function (req, res) {
  opts.v && console.log(new Date().toISOString(), '>>', req.method, req.url)

  var match = req.url.match(AWS_LAMBDA_API_URL_REGEX) || []
  var name = match[1]

  if (functions[name] == null) {
    res.statusCode = 404
    opts.v && console.log(new Date().toISOString(), '<< 404 Missing function', name, 'in template')
    return res.end('Function ' + name + ' not found in template')
  }

  var eventBody = []

  req.on('data', data => eventBody.push(data))
  req.on('end', () => {
    var params = {
      handler: functions[name],
      taskDir: functionsDir
    }

    var event = eventBody.join('')
    if (event !== '') {
      params.event = JSON.parse(event)
    }

    var result = lambdaInvoke(params)
    opts.v && console.log(new Date().toISOString(), '<< 200', result.substr(0, 40), result.length > 40 ? '...' : '')
    res.end(result)
  })

}).listen(opts.port, function () {
  console.log('Starting server at port:', opts.port)
})