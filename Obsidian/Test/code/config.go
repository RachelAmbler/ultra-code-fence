package config

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

// Config holds all application configuration.
type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	Cache    CacheConfig    `json:"cache"`
	Logging  LoggingConfig  `json:"logging"`
}

// ServerConfig holds HTTP server settings.
type ServerConfig struct {
	Host         string        `json:"host"`
	Port         int           `json:"port"`
	ReadTimeout  time.Duration `json:"read_timeout"`
	WriteTimeout time.Duration `json:"write_timeout"`
	MaxBodySize  int64         `json:"max_body_size"`
}

// DatabaseConfig holds database connection settings.
type DatabaseConfig struct {
	Driver          string `json:"driver"`
	DSN             string `json:"dsn"`
	MaxOpenConns    int    `json:"max_open_conns"`
	MaxIdleConns    int    `json:"max_idle_conns"`
	ConnMaxLifetime int    `json:"conn_max_lifetime_secs"`
}

// CacheConfig holds Redis cache settings.
type CacheConfig struct {
	Addr     string        `json:"addr"`
	Password string        `json:"password"`
	DB       int           `json:"db"`
	TTL      time.Duration `json:"ttl"`
}

// LoggingConfig holds logging settings.
type LoggingConfig struct {
	Level  string `json:"level"`
	Format string `json:"format"`
	Output string `json:"output"`
}

// Load reads configuration from a JSON file.
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading config file: %w", err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing config file: %w", err)
	}

	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	return &cfg, nil
}

// validate checks that all required fields are set.
func (c *Config) validate() error {
	if c.Server.Port <= 0 || c.Server.Port > 65535 {
		return fmt.Errorf("invalid port: %d", c.Server.Port)
	}
	if c.Database.DSN == "" {
		return fmt.Errorf("database DSN is required")
	}
	return nil
}

// Defaults returns a Config with sensible defaults.
func Defaults() *Config {
	return &Config{
		Server: ServerConfig{
			Host:         "0.0.0.0",
			Port:         8080,
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			MaxBodySize:  10 << 20, // 10 MB
		},
		Database: DatabaseConfig{
			Driver:          "postgres",
			MaxOpenConns:    25,
			MaxIdleConns:    5,
			ConnMaxLifetime: 300,
		},
		Cache: CacheConfig{
			Addr: "localhost:6379",
			DB:   0,
			TTL:  5 * time.Minute,
		},
		Logging: LoggingConfig{
			Level:  "info",
			Format: "json",
			Output: "stdout",
		},
	}
}
