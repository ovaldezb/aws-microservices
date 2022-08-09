import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { ebClient } from "./eventBridgeClient"

exports.handler = async function(event){
  console.log("Basket: ", JSON.stringify(event, undefined,2));

  let body;
  try {
    switch(event.httpMethod){
      case 'GET':
        if(event.pathParameters != null){
          body = await getBasket(event.pathParameters.userName);
        }else{
          body = await getAllBaskets(event)
        }
        break;
      case 'POST':
        if(event.path === '/basket/checkout'){
          body = await checkoutBasket(event);
        }else{
          body = await createBasket(event);
        }
        break;
      case 'DELETE':
        body = await deleteBasket(event.pathParameters.userName);
        break;
      default:
        throw new Error('Unsupported route '+event.httpMethod);
    }
    return{
      statusCode: 200,
      headers: {
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        message: 'Successfully finished operations: '+event.httpMethod,
        body: body
      })
    }
  } catch (e) {
    return{
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to perform operation.",
        errorMsg: e.message,
        errorStack: e.stack,
      })
    };
  }
  
};

const getBasket  = async (userName) =>{
  console.log("getBasket");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName: userName })
    }
    const {Item} = await ddbClient.send(new GetItemCommand(params));
    console.log(Item);
    return (Item) ? unmarshall(Item) : {};

  } catch (error) {
    console.error(error);
    throw error;
  }
}

const getAllBaskets = async () =>{
  console.log("GetAllBaskets");
  try{
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME
    }
    const {Items}  = await ddbClient.send(new ScanCommand(params));
    console.log(Items);
    return (Items) ? Items.map((item) => unmarshall(item)) : {};
  }catch(error){
    console.error(error);
    throw error;
  }
}

const createBasket = async (event) =>{
  console.log("Create Basket");
  try {
    const basketRequest = JSON.parse(event.body);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(basketRequest || {})
    }
    const createResult = await ddbClient.send(new PutItemCommand(params));
    console.log(createResult);
    return createResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const deleteBasket = async (userName) =>{
  console.log("Delete Basket");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({userName: userName})
    };
    const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
    console.log(deleteResult);
    return deleteResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const checkoutBasket = async (event) =>{
  console.log("Check out Basket");
  const checkoutRequest = JSON.parse(event.body);
  if(checkoutRequest == null || checkoutRequest.userName == null){
    throw new Error('userName does not existe');
  }

  const basket = await getBasket(checkoutRequest.userName);

  const checkoutPayload = prepareOrderPayload(checkoutRequest, basket);
  //publish an event to the eventbridge
  const publishEvent = await publishCheckoutBasketEvent(checkoutPayload);

  await deleteBasket(checkoutRequest.userName);

}

const prepareOrderPayload = (checkoutRequest, basket) =>{
  console.log('prepareOrderPayload');

  try {
    if(basket == null || basket.items == null){
      throw new Error('basket should exist in items'+basket);
    }

    let totalPrice = 0;
    basket.items.forEach(item =>  totalPrice = totalPrice+ item.price);
    checkoutRequest.totalPrice = totalPrice;
    console.log(checkoutRequest);

    Object.assign(checkoutRequest,basket);
    console.log("Success prepareOrderPayload, orderPayload:", checkoutRequest);
    return checkoutRequest;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const publishCheckoutBasketEvent = async (checkoutPayload) =>{
  console.log('publishCheckoutBasketEvent with payload: '+checkoutPayload);

  try {
    const params = {
      Entries: [
        {
          Source: process.env.EVENT_SOURCE,
          Detail: JSON.stringify(checkoutPayload),
          DetailType: process.env.EVENT_DETAILTYPE,
          Resources: [ ],
          EventBusName: process.env.EVENT_BUSNAME
        }
      ],
    };

    const data = await ebClient.send(new PutEventsCommand(params));
    console.log("Success, event sent; requestID:",data);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}