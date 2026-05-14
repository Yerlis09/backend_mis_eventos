from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_name: str = "Mis Eventos Backend"
    database_url: str = "sqlite:///./test.db"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
