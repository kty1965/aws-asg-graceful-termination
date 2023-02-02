import clientAutoScaling from "@aws-sdk/client-auto-scaling";
import clientECS from "@aws-sdk/client-ecs";

const { AutoScalingClient, CompleteLifecycleActionCommand } = clientAutoScaling;
const {
  ECSClient,
  ListContainerInstancesCommand,
  UpdateContainerInstancesStateCommand,
  ContainerInstanceStatus,
} = clientECS;

export const getContainerInstanceId = async ({
  instanceId,
  clusterName,
  region,
}) => {
  const client = new ECSClient({ region });
  const command = new ListContainerInstancesCommand({
    cluster: clusterName,
    filter: `attribute:instanceId==${instanceId}`,
  });
  var response;
  try {
    response = await client.send(command);
    const [containerInstanceArn] = response.containerInstanceArns;
    return containerInstanceArn;
  } catch (error) {
    console.log(error);
    response = null;
  }
  return response;
};

export const updateContainerInstance = async ({
  clusterName,
  containerInstanceId,
  status,
}) => {
  const client = new ECSClient({ region });
  const command = new UpdateContainerInstancesStateCommand({
    cluster: clusterName,
    containerInstances: [containerInstanceId],
    status,
  });
  var response;
  try {
    response = await client.send(command);
    if (response.failures.length > 0) {
      response = null;
    }
  } catch (error) {
    console.log(error);
    response = null;
  }
  return response;
};

export const drainContainerInstance = async ({
  clusterName,
  containerInstanceId,
}) => {
  return updateContainerInstance({
    clusterName,
    containerInstanceId,
    status: ContainerInstanceStatus.DRAINING,
  });
};

export const completeLifecycleAction = async ({
  region,
  autoScalingGroupName,
  lifecycleHookName,
  ec2InstanceId,
  lifecycleActionToken,
}) => {
  const client = new AutoScalingClient({ region });
  const command = new CompleteLifecycleActionCommand({
    AutoScalingGroupName: autoScalingGroupName,
    LifecycleHookName: lifecycleHookName,
    InstanceId: ec2InstanceId,
    LifecycleActionToken: lifecycleActionToken,
    /* required */ LifecycleActionResult: "CONTINUE",
  });
  var response;

  try {
    response = await client.send(command);
  } catch (error) {
    console.log(error);
    response = null;
  }
  return response;
};
