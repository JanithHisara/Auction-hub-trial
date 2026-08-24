import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";

/**
 * AWS IoT Data Plane Client
 * 
 * Make sure to add these to your .env.local file:
 * NEXT_PUBLIC_AWS_IOT_ENDPOINT=https://<your-endpoint>-ats.iot.<region>.amazonaws.com
 * AWS_ACCESS_KEY_ID=<your-access-key>
 * AWS_SECRET_ACCESS_KEY=<your-secret-key>
 * AWS_REGION=<your-region>
 */

const client = new IoTDataPlaneClient({
  region: process.env.AWS_REGION || "ap-south-1",
  endpoint: process.env.NEXT_PUBLIC_AWS_IOT_ENDPOINT, 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});

/**
 * Publishes an MQTT message directly to AWS IoT Core to instantly wake up the device.
 * @param deviceId The ID of the device (e.g., "1234")
 * @param action The action to trigger (e.g., "SYNC_DB")
 * @param additionalPayload Any extra data to send (optional)
 */
export async function pushUpdateToDevice(deviceId: string, action: string = "SYNC_DB", additionalPayload: any = {}) {
  const topic = `auction/${deviceId}/response`;
  
  const payload = {
    Message_ID: crypto.randomUUID(),
    Device_ID: deviceId,
    Action: action,
    Msg_Type: "response",
    DateTime: new Date().toISOString(),
    ...additionalPayload
  };

  try {
    const command = new PublishCommand({
      topic,
      payload: Buffer.from(JSON.stringify(payload)),
      qos: 0
    });

    await client.send(command);
    console.log(`[AWS IoT] Successfully pushed instant update to device ${deviceId} on topic ${topic}`);
    return { success: true };
  } catch (error) {
    console.error("[AWS IoT] Failed to push update to device:", error);
    return { success: false, error };
  }
}
