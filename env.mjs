export const env = {
  afterDrainingWaitTimeSeconds:
    process.env.AFTER_DRAINING_WAIT_TIME_SECONDS != null
      ? Number(process.env.AFTER_DRAINING_WAIT_TIME_SECONDS)
      : 300,
};
