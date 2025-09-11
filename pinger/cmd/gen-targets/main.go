package main

import (
	"flag"
	"fmt"
	"os"
)

func main() {
	out := flag.String("out", "targets.txt", "archivo de salida")
	flag.Parse()

	f, err := os.Create(*out)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	count := 0
	for i := 0; i <= 11 && count < 3000; i++ {
		for j := 1; j <= 254 && count < 3000; j++ {
			fmt.Fprintf(f, "192.168.%d.%d\n", i, j)
			count++
		}
	}
}