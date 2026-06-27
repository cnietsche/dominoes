FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o lobby ./cmd/lobby

FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/lobby .
EXPOSE 8000
ENTRYPOINT ["./lobby"]
