#include <Arduino_RouterBridge.h>
#include <Modulino.h>

// ------------------ Modulino modules ------------------
ModulinoMovement movement;
ModulinoThermo thermo;

// ------------------ Pins ------------------
const int IR_PIN = 7;
const int HEART_PIN = A1;
const int MQ2_AO_PIN = A0;
const int MQ2_DO_PIN = 9;

// ------------------ Variables ------------------
float x, y, z;
float roll, pitch, yaw;
float celsius, humidity;

// ------------------ Heart rate processing ------------------
float hrBaseline = 0.0f;
float hrHp = 0.0f;

const float BASELINE_ALPHA = 0.01f;
const float HP_ALPHA = 0.20f;

float HP_THRESHOLD = 3.0f;
bool hrArmed = true;

unsigned long lastBeatMs = 0;
float bpm = 0.0f;

const unsigned long REFRACTORY_MS = 450;

// ------------------ MQ-2 estimate ------------------
float estimateMQ2ppmFromADC(int adc) {
  return (adc / 1023.0f) * 10000.0f;
}

void setup() {
  Bridge.begin();
  Monitor.begin();     // JSON will go through Monitor
  delay(500);

  pinMode(IR_PIN, INPUT);
  pinMode(MQ2_DO_PIN, INPUT);

  Modulino.begin();
  movement.begin();
  thermo.begin();
}

void loop() {

  int irState = digitalRead(IR_PIN);

  movement.update();
  x = movement.getX();
  y = movement.getY();
  z = movement.getZ();
  roll  = movement.getRoll();
  pitch = movement.getPitch();
  yaw   = movement.getYaw();

  celsius  = thermo.getTemperature();
  humidity = thermo.getHumidity();

  int heartRaw = analogRead(HEART_PIN);

  if (hrBaseline == 0.0f) hrBaseline = (float)heartRaw;
  hrBaseline = (1.0f - BASELINE_ALPHA) * hrBaseline + BASELINE_ALPHA * (float)heartRaw;

  float hpInstant = (float)heartRaw - hrBaseline;
  hrHp = (1.0f - HP_ALPHA) * hrHp + HP_ALPHA * hpInstant;

  unsigned long now = millis();

  if (!hrArmed && hrHp < (HP_THRESHOLD * 0.5f)) {
    hrArmed = true;
  }

  if (hrArmed && hrHp >= HP_THRESHOLD) {
    if (lastBeatMs != 0 && (now - lastBeatMs) >= REFRACTORY_MS) {
      unsigned long dt = now - lastBeatMs;
      bpm = 60000.0f / (float)dt;
    }
    lastBeatMs = now;
    hrArmed = false;
  }

  int mq2Analog = analogRead(MQ2_AO_PIN);
  int mq2Digital = digitalRead(MQ2_DO_PIN);
  float mq2Ppm = estimateMQ2ppmFromADC(mq2Analog);

  // ---------- JSON OUTPUT ----------
  Monitor.print("{");

  Monitor.print("\"t_ms\":"); Monitor.print(now); Monitor.print(",");
  Monitor.print("\"ir\":"); Monitor.print(irState == LOW ? 1 : 0); Monitor.print(",");

  Monitor.print("\"accel\":{");
  Monitor.print("\"x\":"); Monitor.print(x, 3); Monitor.print(",");
  Monitor.print("\"y\":"); Monitor.print(y, 3); Monitor.print(",");
  Monitor.print("\"z\":"); Monitor.print(z, 3);
  Monitor.print("},");

  Monitor.print("\"rpy\":{");
  Monitor.print("\"roll\":"); Monitor.print(roll, 1); Monitor.print(",");
  Monitor.print("\"pitch\":"); Monitor.print(pitch, 1); Monitor.print(",");
  Monitor.print("\"yaw\":"); Monitor.print(yaw, 1);
  Monitor.print("},");

  Monitor.print("\"thermo\":{");
  Monitor.print("\"c\":"); Monitor.print(celsius, 2); Monitor.print(",");
  Monitor.print("\"rh\":"); Monitor.print(humidity, 2);
  Monitor.print("},");

  Monitor.print("\"heart\":{");
  Monitor.print("\"raw\":"); Monitor.print(heartRaw); Monitor.print(",");
  Monitor.print("\"hp\":"); Monitor.print(hrHp, 2); Monitor.print(",");
  Monitor.print("\"bpm\":"); Monitor.print(bpm, 1); Monitor.print(",");
  Monitor.print("\"armed\":"); Monitor.print(hrArmed ? 1 : 0);
  Monitor.print("},");

  Monitor.print("\"mq2\":{");
  Monitor.print("\"ao\":"); Monitor.print(mq2Analog); Monitor.print(",");
  Monitor.print("\"do\":"); Monitor.print(mq2Digital); Monitor.print(",");
  Monitor.print("\"triggered\":"); Monitor.print(mq2Digital == LOW ? 1 : 0); Monitor.print(",");
  Monitor.print("\"est_ppm\":"); Monitor.print(mq2Ppm, 0);
  Monitor.print("}");

  Monitor.println("}");

  delay(250);
}