export async function getArduinoData() {
  try {
    const response = await fetch("/getTelemetry");
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to get Arduino Data,", error);
  }
}
