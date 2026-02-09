ui = true

# ⭐ FILE STORAGE BACKEND (for production)
# Replace with HA storage (Consul, DynamoDB, etc) for true HA
storage "file" {
  path = "/vault/data"
}

# ⭐ LISTENER CONFIGURATION
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = true  # Set to false and configure tls_cert_file/tls_key_file in production with real certs
  # tls_cert_file = "/vault/tls/vault.crt"
  # tls_key_file  = "/vault/tls/vault.key"
}

# ⭐ API / LEASE CONFIGURATION
api_addr = "http://127.0.0.1:8200"

# ⭐ LOG CONFIGURATION
log_level = "info"
log_format = "json"

# ⭐ TELEMETRY (optional - for monitoring)
# telemetry {
#   prometheus_retention_time = "30s"
#   disable_hostname = false
# }
