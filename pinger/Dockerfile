# syntax=docker/dockerfile:1

FROM golang:1.24 as build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /pinger

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=build /pinger /pinger
ENTRYPOINT ["/pinger"]