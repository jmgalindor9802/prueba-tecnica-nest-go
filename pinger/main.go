package main

import (
    "bufio"
    "flag"
    "fmt"
    "log"
    "os"
    "strings"
    "sync"
    "time"

    ping "github.com/go-ping/ping"
)

type PingResult struct {
    IP        string
    Reachable bool
    Latency   time.Duration
    Err       error
}

func worker(id int, jobs <-chan string, results chan<- PingResult, timeout time.Duration, count int) {
    for ip := range jobs {
        result := PingResult{IP: ip}
        pinger, err := ping.NewPinger(ip)
        if err != nil {
            result.Err = err
            results <- result
            continue
        }
        pinger.Count = count
        pinger.Timeout = timeout
        if err := pinger.Run(); err != nil {
            result.Err = err
            results <- result
            continue
        }
        stats := pinger.Statistics()
        result.Reachable = stats.PacketsRecv > 0
        if result.Reachable {
            result.Latency = stats.AvgRtt
        } else {
            result.Err = fmt.Errorf("timeout")
        }
        results <- result
    }
}

func readTargets(file string, args []string) ([]string, error) {
    if file == "" {
        if len(args) == 0 {
            return nil, fmt.Errorf("no targets provided")
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

    for res := range results {
        if res.Err != nil || !res.Reachable {
            fmt.Printf("%s unreachable: %v\n", res.IP, res.Err)
            continue
        }
        fmt.Printf("%s reachable in %v\n", res.IP, res.Latency)
    }
}