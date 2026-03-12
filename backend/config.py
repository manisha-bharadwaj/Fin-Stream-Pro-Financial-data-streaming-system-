from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    QUEUE_MAX_SIZE: int = 500
    PRODUCER_THREADS: int = 5
    CONSUMER_BATCH_SIZE: int = 50
    WS_BROADCAST_INTERVAL_MS: int = 100
    BACKPRESSURE_STRATEGY: str = "DROP"   # DROP | BLOCK | SAMPLE
    SAMPLE_THRESHOLD: float = 0.8         # 80% full before sampling kicks in
    SAMPLE_RATE: int = 3                  # enqueue every 3rd tick when sampling
    DB_PATH: str = "./data/finstream.db"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://frontend:5173"]
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file="backend/.env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

# Ensure database directory exists
os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)
