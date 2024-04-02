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

  var metadata;
  if (
    typeof NotificationMetadata === "string" ||
    NotificationMetadata instanceof String
  ) {
    metadata = JSON.parse(NotificationMetadata);
  } else {
    metadata = NotificationMetadata;
  }

  const { clusterName } = metadata;

  const containerInstanceId = await getContainerInstanceId({
    instanceId: EC2InstanceId,
    clusterName,
    region,
  });
  console.log(
    `containerInstanceId: ${containerInstanceId} on cluster: ${clusterName}, ec2InstanceId: ${EC2InstanceId}`
  );

  var ret;
  if (containerInstanceId == null || containerInstanceId == undefined) {
    console.log(
      `containerInstanceId not found on cluster: ${clusterName}, ec2InstanceId: ${EC2InstanceId}`
    );
    ret = await completeLifecycleAction({
      region,
      autoScalingGroupName: AutoScalingGroupName,
      lifecycleHookName: LifecycleHookName,
      ec2InstanceId: EC2InstanceId,
      lifecycleActionToken: LifecycleActionToken,
    });
  } else if (containerInstanceId != null) {
    // arn:aws:ecs:${region}:${accountId}:container-instance/ecsCluster/${id}
    await drainContainerInstance({
      clusterName,
      containerInstanceId: containerInstanceId.split("/").slice(-1).pop(),
      region,
    });
    console.log(`Waiting for draining ${env.afterDrainingWaitTimeSeconds}...`);
    await sleep(env.afterDrainingWaitTimeSeconds * 1000);
    console.log("draining waiting done");
    ret = await completeLifecycleAction({
      region,
      autoScalingGroupName: AutoScalingGroupName,
      lifecycleHookName: LifecycleHookName,
      ec2InstanceId: EC2InstanceId,
      lifecycleActionToken: LifecycleActionToken,
    });
  }

  console.log(`response from completeLifecycleAction: ${JSON.stringify(ret)}`);
};
