import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as apigw from '@aws-cdk/aws-apigateway'
import * as path from 'path'

export class CdkFirstAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table definition
    const greetingsTable = new dynamodb.Table(this, "GreetingsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING }
    })

    // lambda function 
    const saveHelloFunction = new lambda.Function(this, "SaveHelloFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler.saveHello',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      environment: {
        GREETINGS_TABLE: greetingsTable.tableName
      }
    })

    const getHelloFunction = new lambda.Function(this, "GetHelloFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler.getHello',
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      environment: {
        GREETINGS_TABLE: greetingsTable.tableName
      }
    })

    // Permissions to lambda to dynamo table
    greetingsTable.grantReadWriteData(saveHelloFunction)
    greetingsTable.grantReadData(getHelloFunction)

    // Create the API Gateway ith one method and path
    const helloAPI = new apigw.RestApi(this, "helloApi")

    helloAPI.root
      .resourceForPath("hello")
      .addMethod("POST", new apigw.LambdaIntegration(saveHelloFunction))

    helloAPI.root
      .resourceForPath("hello")
      .addMethod("GET", new apigw.LambdaIntegration(getHelloFunction))

  }
}
