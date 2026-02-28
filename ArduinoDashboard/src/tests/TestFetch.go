package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

// TelemetryData is your fake Arduino telemetry
type TelemetryData struct {
	DistanceTraveled   int `json:"DistanceTraveled"`
	DistanceFromSensor int `json:"DistanceFromSensor"`
	PosX               int `json:"PosX"`
	PosY               int `json:"PosY"`
	HeatTemp           int `json:"HeatTemp"`
}

// generateRandomData generates random telemetry values
func generateRandomData() TelemetryData {
	return TelemetryData{
		DistanceTraveled:   rand.Intn(5) + 5,
		DistanceFromSensor: rand.Intn(5) + 5,
		PosX:               rand.Intn(5) + 5,
		PosY:               rand.Intn(5) + 5,
		HeatTemp:           rand.Intn(5) + 5,
	}
}

// handler serves the random telemetry as JSON
func telemetryHandler(w http.ResponseWriter, r *http.Request) {
	// Allow React frontend (or all origins for testing)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")	
	
	data := generateRandomData()

	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		http.Error(w, "Error generating JSON", http.StatusInternalServerError)
		return
	}

	w.Write(jsonData)
	fmt.Println("Sent data:", data) // optional: log to console
}

func main() {
	rand.Seed(time.Now().UnixNano())

	mux := http.NewServeMux()
	mux.HandleFunc("/getTelemetry", telemetryHandler)

	serverPort := 8081
	fmt.Printf("Telemetry server running at http://localhost:%d/getTelemetry\n", serverPort)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", serverPort), mux); err != nil {
		panic(err)
	}
}
