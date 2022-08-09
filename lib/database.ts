import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { UserPoolDomainTarget } from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

export class SwnDatabase extends Construct{

  public readonly productTable: ITable;
  public readonly basketTable: ITable;
  public readonly orderTable: ITable;

  constructor(scope: Construct, id: string){
    super(scope, id);

    this.productTable = this.createProductTable();
    this.basketTable = this.createBasketTable();
    this.orderTable = this.createOrderTable();
  }

  private createProductTable() : ITable {
    const productTable = new Table(this,'product',{
      partitionKey:{
        name:'id',
        type: AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY,
      tableName: 'product',
      billingMode: BillingMode.PAY_PER_REQUEST
    });
    return productTable;
  }
// basket table
    //basket : PK: username -- item (set-MAP object) 
    //Item 1 - {quantity - color - price - productID- productName }
  private createBasketTable() : ITable{
    const basketTable = new Table(this,'basket',{
      partitionKey: {
        name: 'userName',
        type: AttributeType.STRING
      },
      tableName: 'basket',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
    return basketTable;
  }

  private createOrderTable() : ITable{
    const orderTable = new Table(this,'order',{
      partitionKey:{
        name:'userName',
        type: AttributeType.STRING
      },
      sortKey:{
        name: 'orderDate',
        type: AttributeType.STRING
      },
      tableName: 'order',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST
    });
    return orderTable;
  }
  
}