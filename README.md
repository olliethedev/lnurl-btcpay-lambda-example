
### Deployment


```
$ serverless deploy
```


After running deploy, note the endpoint value as you will need it:

```bash
........
endpoints:
  ANY - https://xxxxxxx.execute-api.us-east-1.amazonaws.com/dev/
functions:
  api: aws-node-rest-api-dev-hello
........
```

_Note_: In current form, after deployment, your API is public and can be invoked by anyone. For production deployments, you might want to configure an authorizer. For details on how to do that, refer to [http event docs](https://www.serverless.com/framework/docs/providers/aws/events/apigateway/).

### Invocation

After successful deployment, you can call the created application via HTTP:

```bash
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/dev/
```

```json
{
  "message": "Go Serverless v2.0! Your function executed successfully!",
}
```

### Local development

You can invoke your function locally by using the following command

```bash
serverless invoke local --function hello
```

Alternatively, it is also possible to emulate API Gateway and Lambda locally by using `serverless-offline` plugin. In order to do that, execute the following command:

```
serverless offline
```

### Local Invocation

You can call the created local application via HTTP:

```bash
curl http://localhost:3000/dev/
```

```json
{
  "message": "Go Serverless v2.0! Your function executed successfully!",
}
```