import {
  AutoScalingClient,
  CompleteLifecycleActionCommand,
} from "@aws-sdk/client-auto-scaling";

export const handler = async (event, context, callback) => {
  console.log("LogAutoScalingEvent");
  console.log("Received event:", JSON.stringify(event, null, 2));

  var eventDetail = event.detail;
  var params = {
    AutoScalingGroupName: eventDetail["AutoScalingGroupName"] /* required */,
    LifecycleActionResult: "CONTINUE" /* required */,
    LifecycleHookName: eventDetail["LifecycleHookName"] /* required */,
    InstanceId: eventDetail["EC2InstanceId"],
    LifecycleActionToken: eventDetail["LifecycleActionToken"],
  };
  var response;
  const client = new AutoScalingClient({ region: event.region });
  const command = new CompleteLifecycleActionCommand(params);
  try {
    response = await client.send(command);
  } catch (error) {
    const { requestId, cfId, extendedRequestId } = error.$$metadata;
    console.log({ requestId, cfId, extendedRequestId });
    return {
      statusCode: 500,
      body: JSON.stringify("ERROR"),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify("SUCCESS"),
  };
};
