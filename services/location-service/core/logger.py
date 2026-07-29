from pathlib import Path
import logging
from logging.handlers import RotatingFileHandler


class LoggerFactory:
    """
    Creates a singleton logger.

    Every module should call:

    logger = LoggerFactory.get_logger(__name__)
    """

    LOG_DIRECTORY = Path("logs")

    LOG_FILE = LOG_DIRECTORY / "location_intelligence.log"

    _configured = False

    @classmethod
    def _configure(cls):

        if cls._configured:
            return

        cls.LOG_DIRECTORY.mkdir(
            exist_ok=True
        )

        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

        file_handler = RotatingFileHandler(
            cls.LOG_FILE,
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8"
        )

        file_handler.setFormatter(formatter)

        console_handler = logging.StreamHandler()

        console_handler.setFormatter(formatter)

        root_logger = logging.getLogger()

        root_logger.setLevel(logging.INFO)

        root_logger.addHandler(file_handler)

        root_logger.addHandler(console_handler)

        cls._configured = True

    @classmethod
    def get_logger(cls, name: str):

        cls._configure()

        return logging.getLogger(name)
