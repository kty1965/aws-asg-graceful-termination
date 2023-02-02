import {
  AutoScalingClient,
  CompleteLifecycleActionCommand,
  CompleteLifecycleActionCommandInput,
} from "@aws-sdk/client-auto-scaling";

import {
  ECSClient,
  ListContainerInstancesCommand,
  ListContainerInstancesCommandInput,
  UpdateContainerInstancesStateCommand,
  UpdateContainerInstancesStateCommandInput,
  ContainerInstanceStatus,
} from "@aws-sdk/client-ecs"; // ES Modules import

const getContainerInstanceId = async ({ instanceId, clusterName, region }) => {
  const client = new ECSClient({ region });
  const input = new ListContainerInstancesCommandInput({
    cluster: clusterName,
    filter: `attribute:instanceId==${instanceId}`,
  });
  const command = new ListContainerInstancesCommand(input);
  var response;
  try {
    response = await client.send(command);
    const [containerInstanceArn] = response.containerInstanceArns;
    return containerInstanceArn;
  } catch (error) {
    const { requestId, cfId, extendedRequestId } = error.$$metadata;
    console.log({ requestId, cfId, extendedRequestId });
    response = null;
  }
  return response;
};

const updateContainerInstance = async ({
  clusterName,
  containerInstanceId,
  status,
}) => {
  const client = new ECSClient({ region });
  const input = new UpdateContainerInstancesStateCommandInput({
    cluster: clusterName,
    containerInstances: [containerInstanceId],
    status,
  });
  const command = new UpdateContainerInstancesStateCommand(input);
  var response;
  try {
    response = await client.send(command);
    if (response.failures.length > 0) {
      response = null;
    }
  } catch (error) {
    const { requestId, cfId, extendedRequestId } = error.$$metadata;
    console.log({ requestId, cfId, extendedRequestId });
    response = null;
  }
  return response;
};

const drainContainerInstance = async ({ clusterName, containerInstanceId }) => {
  return updateContainerInstance({
    clusterName,
    containerInstanceId,
    status: ContainerInstanceStatus.DRAINING,
  });
};

const completeLifecycleAction = async ({
  region,
  autoScalingGroupName,
  lifecycleHookName,
  ec2InstanceId,
  lifecycleActionToken,
}) => {
  const client = new AutoScalingClient({ region });

  const input = new CompleteLifecycleActionCommandInput({
    AutoScalingGroupName: autoScalingGroupName,
    LifecycleHookName: lifecycleHookName,
    InstanceId: ec2InstanceId,
    LifecycleActionToken: lifecycleActionToken,
    /* required */ LifecycleActionResult: "CONTINUE",
  });
  const command = new CompleteLifecycleActionCommand(input);
  var response;

  try {
    response = await client.send(command);
  } catch (error) {
    const { requestId, cfId, extendedRequestId } = error.$$metadata;
    console.log({ requestId, cfId, extendedRequestId });
    response = null;
  }
  return response;
};
