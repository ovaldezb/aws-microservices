import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SwnApiGateway } from './apigateway';
import { SwnDatabase } from './database';
import { SwnEventBus } from './eventbus';
import { SwnMicroservices } from './microservices';
import { SwnQueue } from './queue';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroservicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const database = new SwnDatabase(this,'Database');

    const microservices = new SwnMicroservices(this,'Microservices',{
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable
    });

    const apigateway = new SwnApiGateway(this,'ApiGateway',{
      productMicroservice: microservices.productMicroservice,
      basketMicroservice: microservices.basketMicroservice,
      orderMicroservice: microservices.orderingMicroservice
    });

    const queue = new SwnQueue(this,'Queue', {
      consumer: microservices.orderingMicroservice
    });

    const eventBus = new SwnEventBus(this, 'EventBus',{
      publisherFunction: microservices.basketMicroservice,
      targetQueue: queue.orderQueue
    });
    // const productTable = new Table(this,'product',{
    //   partitionKey:{
    //     name:'id',
    //     type: AttributeType.STRING
    //   },
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   tableName: 'product',
    //   billingMode: BillingMode.PAY_PER_REQUEST
    // });

    // const nodeJsFunctionProps : NodejsFunctionProps = {
    //   bundling:{
    //     externalModules: [
    //       'aws-sdk'
    //     ]
    //   },
    //   environment:{
    //     PRIMARY_KEY:'id', 
    //     DYNAMODB_TABLE_NAME:database.productTable.tableName
    //   },
    //   runtime: Runtime.NODEJS_14_X
    // };

    // const productFunction = new NodejsFunction(this,'productLambdaFunction',{
    //   entry: join(__dirname, '/../src/product/index.js'),
    //   ...nodeJsFunctionProps,
    // });
    
    // database.productTable.grantReadWriteData(productFunction);

    // const apigw = new LambdaRestApi(this,'productApi',{
    //   restApiName: 'Product Service',
    //   handler: microservices.productMicroservices,
    //   proxy: false
    // });

    // const product = apigw.root.addResource('product');
    // product.addMethod('GET');
    // product.addMethod('POST');

    // const singleProduct = product.addResource('{id}');
    // singleProduct.addMethod('GET');
    // singleProduct.addMethod('PUT');
    // singleProduct.addMethod('DELETE');
  }
}
