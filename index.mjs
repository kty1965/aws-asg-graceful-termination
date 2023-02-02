import {
  getContainerInstanceId,
  updateContainerInstance,
  drainContainerInstance,
  completeLifecycleAction,
} from "./commands.mjs";

import { env } from "./env.mjs";

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export const handler = async (event, context, callback) => {
  console.log("LogAutoScalingEvent");
  console.log("Received event:", JSON.stringify(event, null, 2));

  const { region, account } = event;
  const {
    AutoScalingGroupName,
    LifecycleHookName,
    EC2InstanceId,
    LifecycleActionToken,
    NotificationMetadata,
  } = event.detail;

  const metadata = JSON.parse(NotificationMetadata);
  const { clusterName } = metadata;

  const containerInstanceId = getContainerInstanceId({
    instanceId: EC2InstanceId,
    clusterName,
    region,
  });
  console.log(
    `containerInstanceId: ${containerInstanceId} on cluster: ${clusterName}, ec2InstanceId: ${EC2InstanceId}`
  );

  if (containerInstanceId == null || containerInstanceId == undefined) {
    console.log(
      `containerInstanceId not found on cluster: ${clusterName}, ec2InstanceId: ${EC2InstanceId}`
    );
    await completeLifecycleAction({
      region: event.region,
      autoScalingGroupName: AutoScalingGroupName,
      lifecycleHookName: LifecycleHookName,
      ec2InstanceId: EC2InstanceId,
      lifecycleActionToken: LifecycleActionToken,
    });
  } else if (containerInstanceId != null) {
    drainContainerInstance({
      clusterName,
      containerInstanceId,
    });
    console.log(`Waiting for draining ${env.afterDrainingWaitTimeSeconds}...`);
    await sleep(env.afterDrainingWaitTimeSeconds * 1000);
    console.log("draining waiting done");
    await completeLifecycleAction({
      region: event.region,
      autoScalingGroupName: AutoScalingGroupName,
      lifecycleHookName: LifecycleHookName,
      ec2InstanceId: EC2InstanceId,
      lifecycleActionToken: LifecycleActionToken,
    });
  }
};
