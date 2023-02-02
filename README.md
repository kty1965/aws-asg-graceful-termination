# aws-asg-graceful-termination

ASG isntances on ECS cluster graceful shutdown example.

## prerequeistes

Follow this reference [link](https://docs.aws.amazon.com/ko_kr/autoscaling/ec2/userguide/tutorial-lifecycle-hook-lambda.html)

1. Create Lifecycle hooks on ASG

   - Lifecycle transition: `instance terminate`
   - Heartbeat timeout: `600` (You want change)
   - Default result: `CONTINUE` (You want change)
   - Notification metadata:
     ```
       {
         "clusterName": "ecsCluster"
       }
     ```

1. Create EventBridge Rules

   - Build event pattern
     - Event source: `AWS events or EventBridge partner events`
     - Event pattern
       - Event source: `AWS services`
       - AWS service: `Auto Scaling`
       - Event type: `Instance Launch and Terminate`,
       - Specific instance event(s): `EC2 Instance-launch Lifecycle Action`
       - (Optional) Choose specific group name
   - custom event pattern
     ```
     {
       "source": ["aws.autoscaling"],
       "detail-type": ["EC2 Instance-terminate Lifecycle Action"],
       "detail": {
         "AutoScalingGroupName": ["ecs-cluster"]
       }
     }
     ```

1. Create iam role & policy used by Lambda

   - attach `AWSLambdaBasicExecutionRole` to Role
   - attach below policy to Role

   ```
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "autoscaling:CompleteLifecycleAction"
         ],
         "Resource": [
           "arn:aws:autoscaling:${region}:${accountId}:autoScalingGroup:*:autoScalingGroupName/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "ecs:ListContainerInstances"
         ],
         "Resource": [
           "arn:aws:ecs:${region}:${accountId}:cluster/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "ecs:UpdateContainerInstancesState"
         ],
         "Resource": [
           "arn:aws:ecs:${region}:${accountId}:container-instance/*/*"
         ]
       }
     ]
   }
   ```

1. Create using Lambda
   - create lambda role above
1. Add ecs instance attributes for containerInstance filter, add userdata ASG launch template
   ```
   echo ECS_INSTANCE_ATTRIBUTES={\"instanceId\":\"$(curl -s http://169.254.169.254/latest/meta-data/instance-id)\"} >> /etc/ecs/ecs.config
   ```
