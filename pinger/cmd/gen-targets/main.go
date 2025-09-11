package main

import (
	"flag"
	"fmt"
	"math/rand"
	"os"
	"time"
)

func main() {
	out := flag.String("out", "targets.txt", "archivo de salida")
	flag.Parse()

	f, err := os.Create(*out)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	targets := make([]string, 0, 3000)
	realTargets := []string{"8.8.8.8", "1.1.1.1", "208.67.222.222", "9.9.9.9"}
	targets = append(targets, realTargets...)

	for i := 0; i <= 11 && len(targets) < 3000; i++ {
		for j := 1; j <= 254 && len(targets) < 3000; j++ {
			targets = append(targets, fmt.Sprintf("192.168.%d.%d", i, j))
		}
	}

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(targets), func(i, j int) { targets[i], targets[j] = targets
