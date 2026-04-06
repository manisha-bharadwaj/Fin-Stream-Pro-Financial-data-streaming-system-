from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
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
    ALLOWED_ORIGINS: str | list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://frontend:5173"]
    LOG_LEVEL: str = "INFO"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            try:
                import json
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(env_file="backend/.env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

# Ensure database directory exists
os.makedirs(os.path.dirname(settings.DB_PATH), exist_ok=True)
