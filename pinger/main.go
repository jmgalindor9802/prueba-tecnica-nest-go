package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	ping "github.com/go-ping/ping"
)

type PingResult struct {
	IP        string  `json:"ip"`
	Reachable bool    `json:"reachable"`
	LatencyMS float64 `json:"latency_ms"`
	Err       string  `json:"error,omitempty"`
}

var realTargets = []string{
	"8.8.8.8",
	"1.1.1.1",
	"208.67.222.222",
	"9.9.9.9",
}

func worker(id int, jobs <-chan string, results chan<- PingResult, timeout time.Duration, count int) {
	for ip := range jobs {
		result := PingResult{IP: ip}
		pinger, err := ping.NewPinger(ip)
		if err != nil {
			result.Err = err.Error()
			results <- result
			continue
		}
		pinger.Count = count
		pinger.Timeout = timeout
		if err := pinger.Run(); err != nil {
			result.Err = err.Error()
			results <- result
			continue
		}
		stats := pinger.Statistics()
		result.Reachable = stats.PacketsRecv > 0
		if result.Reachable {
			result.LatencyMS = float64(stats.AvgRtt) / float64(time.Millisecond)
		} else {
			result.Err = "timeout"
			result.LatencyMS = 0
		}
		results <- result
	}
}

// generateTargets mezcla algunas IPs reales con direcciones locales hasta llegar a 3000
func generateTargets() []string {
	targets := make([]string, 0, 3000)
	targets = append(targets, realTargets...)
	for i := 0; i <= 11 && len(targets) < 3000; i++ {
		for j := 1; j <= 254 && len(targets) < 3000; j++ {
			targets = append(targets, fmt.Sprintf("192.168.%d.%d", i, j))
		}
	}
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(targets), func(i, j int) { targets[i], targets[j] = targets[j], targets[i] })
	return targets
}

func readTargets(file string, args []string) ([]string, error) {
	if file == "" {
		if len(args) == 0 {
			return generateTargets(), nil
		}
		return args, nil
	}

	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var targets []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			targets = append(targets, line)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return targets, nil
}

func main() {
	workers := flag.Int("workers", 100, "number of concurrent workers")
	timeout := flag.Duration("timeout", time.Second, "timeout per target")
	count := flag.Int("count", 1, "number of echo requests per target")
	file := flag.String("file", "", "file with targets (one per line)")
	flag.Parse()

	targets, err := readTargets(*file, flag.Args())
	if err != nil {
		log.Fatalf("error reading targets: %v", err)
	}

	jobs := make(chan string)
	results := make(chan PingResult)

	var wg sync.WaitGroup
	for i := 0; i < *workers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			worker(id, jobs, results, *timeout, *count)
		}(i)
	}

	go func() {
		for _, t := range targets {
			jobs <- t
		}
		close(jobs)
	}()

	go func() {
		wg.Wait()
		close(results)
	}()

	totalTargets := len(targets)

	var (
		resultStore []PingResult
		storeMu     sync.Mutex
	)

	go func() {
		for res := range results {
			if res.Err != "" || !res.Reachable {
				fmt.Printf("%s unreachable: %v\n", res.IP, res.Err)
			} else {
				fmt.Printf("%s reachable in %.2fms\n", res.IP, res.LatencyMS)
			}
			storeMu.Lock()
			resultStore = append(resultStore, res)
			storeMu.Unlock()
		}
	}()

	http.HandleFunc("/results", func(w http.ResponseWriter, r *http.Request) {
		storeMu.Lock()
		defer storeMu.Unlock()

		resp := struct {
			TotalTargets int          `json:"total_targets"`
			Processed    int          `json:"processed"`
			Results      []PingResult `json:"results"`
		}{
			TotalTargets: totalTargets,
			Processed:    len(resultStore),
			Results:      resultStore,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
