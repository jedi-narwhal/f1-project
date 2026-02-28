package main

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"time"
)

// TelemetryData represents Arduino-like telemetry
type TelemetryData struct {
	DistanceTraveled   int     `json:"DistanceTraveled"`
	DistanceFromSensor int     `json:"DistanceFromSensor"`
	PosX               float64 `json:"PosX"` // longitude
	PosY               float64 `json:"PosY"` // latitude
	HeatTemp           int     `json:"HeatTemp"`
}

// generateRandomData updates telemetry state
func generateRandomData(base *TelemetryData) TelemetryData {

	// Move robot randomly by small real-world increments (~0-35 meters per step)
	dx := (rand.Float64() - 0.5) * 0.0005 // longitude delta
	dy := (rand.Float64() - 0.5) * 0.0005 // latitude delta

	base.PosX += dx
	base.PosY += dy

	// Add movement distance in meters (approx: 1 degree lat/lon ~ 111,000m)
	stepDist := int(math.Sqrt(dx*dx+dy*dy) * 111000)
	base.DistanceTraveled += stepDist

	// Simulate sensor + temperature
	base.DistanceFromSensor = rand.Intn(100)
	base.HeatTemp = rand.Intn(5) + 93

	return *base
}

// HTTP handler
func telemetryHandler(base *TelemetryData) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		data := generateRandomData(base)

		jsonData, err := json.MarshalIndent(data, "", "  ")
		if err != nil {
			http.Error(w, "Error generating JSON", http.StatusInternalServerError)
			return
		}

		w.Write(jsonData)
		fmt.Println("Sent data:", data)
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	baseTelemetry := &TelemetryData{
		DistanceTraveled:   0,
		DistanceFromSensor: 0,
		PosX:               -122.4194, // longitude (San Francisco)
		PosY:               37.7749,   // latitude  (San Francisco)
		HeatTemp:           rand.Intn(5) + 93,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/getTelemetry", telemetryHandler(baseTelemetry))

	serverPort := 8081
	fmt.Printf("Telemetry server running at http://localhost:%d/getTelemetry\n", serverPort)

	if err := http.ListenAndServe(fmt.Sprintf(":%d", serverPort), mux); err != nil {
		panic(err)
	}
}
