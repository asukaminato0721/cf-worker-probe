#!/bin/bash
set -eux -o pipefail
# configure the following variables
WORKER_URL="HERE_YOUR_WORKER_URL"  # Worker URL
HOSTNAME=$(hostname)
INTERVAL=60  # interval in seconds

while true; do
    # collect system info
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    UPTIME=$(uptime | awk '{print $3}')
    LOAD=$(uptime | awk -F'load average:' '{print $2}' | xargs)
    MEM_TOTAL=$(free -m | awk 'NR==2{printf "%.2f", $2/1024}')
    MEM_USED=$(free -m | awk 'NR==2{printf "%.2f", $3/1024}')
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')

    # build JSON data
    JSON_DATA=$(cat << EOF
{
    "timestamp": "$TIMESTAMP",
    "hostname": "$HOSTNAME",
    "metrics": {
        "uptime": "$UPTIME",
        "load": "$LOAD",
        "memory": {
            "total": $MEM_TOTAL,
            "used": $MEM_USED
        },
        "cpu_usage": $CPU_USAGE,
        "disk_usage": "$DISK_USAGE"
    }
}
EOF
)

    # send to Worker
    curl -X POST "$WORKER_URL" \
        -H "Content-Type: application/json" \
        -d "$JSON_DATA" \
        --silent

    sleep $INTERVAL
done

