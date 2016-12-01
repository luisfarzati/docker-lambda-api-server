docker-lambda-api-server
------------------------

A companion tool for the awesome [docker-lambda](https://github.com/lambci/docker-lambda) sandbox.

This is a very basic, local AWS Lambda API server that lets you invoke your lambda functions via the AWS SDK instead of running Docker from the command-line or docker-lambda Node helper.

It also leverages (although very limited at this point) the new [AWS Cloudformation SAM template](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md).   

Prerequisites
-------------

Same as [docker-lambda](https://github.com/lambci/docker-lambda#prerequisites).

Installation
------------

```bash
npm install docker-lambda-api-server
```

Example
-------

Let's suppose you have 2 functions: `hello` and `goodbye`.

```javascript
// hello.js
exports.handler = function(event, context, cb) {
  cb(null, JSON.stringify({hello: 'world'}))
}
```

```javascript
// goodbye.js
exports.handler = function(event, context, cb) {
  cb(null, JSON.stringify({good: 'bye'}))
}
```

First thing you need to do (if you haven't already), is to create a [SAM template](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md) like this:

```yaml
# /greetings.yml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  SayHello:
    Type: AWS::Serverless::Function
    Properties:
      Handler: hello.handler
      Runtime: nodejs4.3
 
  SayGoodbye:
    Type: AWS::Serverless::Function
    Properties:
      Handler: goodbye.handler
      Runtime: nodejs4.3
``` 

As you can see above, we created the definition for our 2 functions, which we named `SayHello` and `SayGoodbye`, each one pointing to the right code file.

We are now ready to start the API server:

```bash
docker-lambda-api-server -f greetings.yml
```

An HTTP server will start listening at `localhost:3000`. You can do a quick test by invoking any of your functions via the AWS Lambda REST API:

```bash
curl http://localhost:3000/2015-03-31/functions/SayHello/invocations

{"hello":"world"}
```

Or you can also invoke the function via the AWS SDK:

```javascript
import { Lambda } from 'aws-sdk'

let lambda = new Lambda({
  region: 'foo-west-1',
  endpoint: 'http://localhost:3000'
})

lambda
  .invoke({ FunctionName: 'SayGoodbye' })
  .promise()
  .then(result => console.log(result))
```

Documentation
-------------

// TODO

In the meanwhile, you can run 

```bash
docker-lambda-api-server -h
```

to see all the options available.

You can also check out the [provided example](/example).


TODO
----

* Unit tests?
* Proper runtime validation (node, node4.3)
* Implement `ClientContext`
* Implement `InvocationType`
* Implement `Qualifier`
* Implement `LogType`
* Implement environment variables in SAM template
* [Your suggestion here](https://github.com/luisfarzati/docker-lambda-api-server/issues/new?labels=feat-request)
