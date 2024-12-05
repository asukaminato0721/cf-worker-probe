CREATE TABLE IF NOT EXISTS probe_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    hostname TEXT NOT NULL,
    uptime TEXT,
    load TEXT,
    memory_total REAL,
    memory_used REAL,
    cpu_usage REAL,
    disk_usage TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON probe_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_hostname ON probe_data(hostname);

