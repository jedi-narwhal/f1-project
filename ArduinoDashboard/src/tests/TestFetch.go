package main

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"sync"
)

const serverPort = 8081

// ArduinoTelemetry is the JSON shape sent by the Arduino / Python bridge
type ArduinoTelemetry struct {
	TMs    int64   `json:"t_ms"`
	IR     int     `json:"ir"`
	Accel  Accel   `json:"accel"`
	RPY    RPY     `json:"rpy"`
	Thermo Thermo  `json:"thermo"`
	Heart  Heart   `json:"heart"`
	MQ2    MQ2     `json:"mq2"`
}

type Accel struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type RPY struct {
	Roll  float64 `json:"roll"`
	Pitch float64 `json:"pitch"`
	Yaw   float64 `json:"yaw"`
}

type Thermo struct {
	C  float64 `json:"c"`
	RH float64 `json:"rh"`
}

type Heart struct {
	Raw   int     `json:"raw"`
	Hp    float64 `json:"hp"`
	BPM   float64 `json:"bpm"`
	Armed int     `json:"armed"`
}

type MQ2 struct {
	AO      int `json:"ao"`
	DO      int `json:"do"`
	Trigger int `json:"triggered"`
	EstPPM  int `json:"est_ppm"`
}

// DashboardTelemetry is what the React dashboard expects (GET response)
type DashboardTelemetry struct {
	Ax   float64 `json:"ax"`
	Ay   float64 `json:"ay"`
	Az   float64 `json:"az"`
	Temp float64 `json:"temp"`
	Hum  float64 `json:"hum"`
	BPM  float64 `json:"bpm"`
	Gas  float64 `json:"gas"`
	IR   string  `json:"ir"`
	TMs  int64   `json:"t_ms"`
}

func arduinoToDashboard(a *ArduinoTelemetry) DashboardTelemetry {
	irStr := "CLEAR"
	if a.IR != 0 {
		irStr = "OBSTACLE DETECTED"
	}
	bpm := a.Heart.BPM
	// Arduino often sends low values (e.g. 1.8); treat as BPM as-is, round for display
	if bpm < 0 {
		bpm = 0
	}
	return DashboardTelemetry{
		Ax:   a.Accel.X,
		Ay:   a.Accel.Y,
		Az:   a.Accel.Z,
		Temp: a.Thermo.C,
		Hum:  a.Thermo.RH,
		BPM:  math.Round(bpm*10) / 10, // one decimal
		Gas:  float64(a.MQ2.EstPPM),
		IR:   irStr,
		TMs:  a.TMs,
	}
}

var (
	latestMu     sync.RWMutex
	latestArduino *ArduinoTelemetry
	latestDashboard DashboardTelemetry
	hasData      bool
)

func cors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")
}

func telemetryHandler(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case "POST":
		var body ArduinoTelemetry
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		latestMu.Lock()
		latestArduino = &body
		latestDashboard = arduinoToDashboard(&body)
		hasData = true
		latestMu.Unlock()
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})

	case "GET":
		latestMu.RLock()
		defer latestMu.RUnlock()
		if !hasData {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(DashboardTelemetry{})
			return
		}
		json.NewEncoder(w).Encode(latestDashboard)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/getTelemetry", telemetryHandler)

	addr := fmt.Sprintf(":%d", serverPort)
	fmt.Printf("Telemetry server at http://localhost:%d/getTelemetry (GET = dashboard format, POST = Arduino JSON)\n", serverPort)
	if err := http.ListenAndServe(addr, mux); err != nil {
		panic(err)
	}
}

