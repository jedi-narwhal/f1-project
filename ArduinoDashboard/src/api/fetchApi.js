export async function getArduinoData() {
  try {
    const response = await fetch("http://localhost:8081/getTelemetry");
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error("Failed to get Arduino Data,", error);
  }
}
