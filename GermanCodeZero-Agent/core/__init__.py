"""
GermanCodeZero-Agent Core System
================================

Hierarchisches Agent-Builder System für lokale LLM-Modelle
"""

from .base_agent import BaseAgent, AgentType
from .nano_agent import NanoAgent
from .mikro_agent import MikroAgent
from .sub_agent import SubAgent
from .domain_agent import DomainAgent
from .enterprise_agent import EnterpriseAgent
from .agent_builder import AgentBuilder
from .agent_registry import AgentRegistry

__version__ = "1.0.0"
__author__ = "GermanCodeZero Team"

__all__ = [
    "BaseAgent",
    "AgentType",
    "NanoAgent",
    "MikroAgent",
    "SubAgent",
    "DomainAgent",
    "EnterpriseAgent",
    "AgentBuilder",
    "AgentRegistry"
]