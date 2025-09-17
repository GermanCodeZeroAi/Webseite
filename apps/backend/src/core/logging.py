"""
Logging configuration with conditional Sentry integration
Supports Uvicorn integration and structured logging
"""

import os
import logging
import sys
from typing import Optional
from logging.config import dictConfig

# Optional Sentry import
try:
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlAlchemyIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    sentry_sdk = None


def init_sentry() -> bool:
    """
    Initialize Sentry SDK only if DSN is configured
    Returns True if Sentry was initialized, False otherwise
    """
    sentry_dsn = os.getenv('SENTRY_DSN')
    
    if not sentry_dsn:
        logging.info("Sentry DSN not configured, skipping initialization")
        return False
    
    if not SENTRY_AVAILABLE:
        logging.warning("Sentry SDK not available, install with: pip install sentry-sdk[fastapi]")
        return False
    
    # Configure Sentry integrations
    integrations = [
        LoggingIntegration(
            level=logging.INFO,        # Capture info and above as breadcrumbs
            event_level=logging.ERROR  # Send errors as events
        ),
        FastApiIntegration(auto_enabling_integrations=False),
        SqlAlchemyIntegration(),
    ]
    
    # Initialize Sentry
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=os.getenv('ENVIRONMENT', 'development'),
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
        debug=os.getenv('ENVIRONMENT') == 'development',
        integrations=integrations,
        # Release tracking
        release=os.getenv('APP_VERSION', 'unknown'),
        # Performance monitoring
        profiles_sample_rate=float(os.getenv('SENTRY_PROFILES_SAMPLE_RATE', '0.1')),
        # Error filtering
        before_send=lambda event, hint: event if should_send_to_sentry(event, hint) else None,
    )
    
    logging.info("Sentry monitoring initialized")
    return True


def should_send_to_sentry(event, hint) -> bool:
    """
    Filter function to determine if an event should be sent to Sentry
    """
    # Don't send health check errors
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        if 'health' in str(exc_value).lower():
            return False
    
    return True


def setup_logging(
    level: str = "INFO",
    json_format: bool = False,
    enable_uvicorn_integration: bool = True
) -> None:
    """
    Setup logging configuration with optional Sentry integration
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        json_format: Whether to use JSON formatting for logs
        enable_uvicorn_integration: Whether to integrate with Uvicorn logging
    """
    
    # Initialize Sentry if configured
    sentry_initialized = init_sentry()
    
    # Configure log formatting
    if json_format:
        formatter_config = {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d"
        }
    else:
        formatter_config = {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S"
        }
    
    # Logging configuration
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": formatter_config,
            "access": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(client_addr)s - %(request_line)s - %(status_code)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout"
            },
            "access": {
                "formatter": "access",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout"
            }
        },
        "loggers": {
            "": {  # root logger
                "level": level,
                "handlers": ["default"],
                "propagate": False
            },
            "uvicorn": {
                "level": level,
                "handlers": ["default"],
                "propagate": False
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["access"],
                "propagate": False
            },
            "uvicorn.error": {
                "level": level,
                "handlers": ["default"],
                "propagate": False
            },
            "fastapi": {
                "level": level,
                "handlers": ["default"],
                "propagate": False
            }
        }
    }
    
    # Apply logging configuration
    dictConfig(logging_config)
    
    # Log initialization status
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized with level: {level}")
    if sentry_initialized:
        logger.info("Sentry integration enabled")
    else:
        logger.info("Sentry integration disabled (DSN not configured or SDK not available)")


def get_uvicorn_log_config() -> dict:
    """
    Get Uvicorn-compatible logging configuration
    This integrates with the main logging setup
    """
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "access": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(client_addr)s - %(request_line)s - %(status_code)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout"
            },
            "access": {
                "formatter": "access", 
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout"
            }
        },
        "loggers": {
            "uvicorn": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False
            },
            "uvicorn.error": {
                "handlers": ["default"],
                "level": "INFO", 
                "propagate": False
            },
            "uvicorn.access": {
                "handlers": ["access"],
                "level": "INFO",
                "propagate": False
            }
        }
    }


# Convenience functions for Sentry integration
def capture_exception(error: Exception, extra: Optional[dict] = None) -> None:
    """Capture exception to Sentry if available"""
    if sentry_sdk:
        with sentry_sdk.configure_scope() as scope:
            if extra:
                for key, value in extra.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_exception(error)
    else:
        logging.error(f"Exception (Sentry not available): {error}", exc_info=True)


def capture_message(message: str, level: str = "info", extra: Optional[dict] = None) -> None:
    """Capture message to Sentry if available"""
    if sentry_sdk:
        with sentry_sdk.configure_scope() as scope:
            if extra:
                for key, value in extra.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_message(message, level)
    else:
        getattr(logging, level.lower(), logging.info)(f"Message (Sentry not available): {message}")