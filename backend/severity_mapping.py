"""
Event Type -> Severity Mapping for SIEM logs
Based on security risk assessment
"""

SEVERITY_MAPPING = {
    # CRITICAL - Immediate threat to system
    "brute_force_attack": "critical",
    "privilege_escalation": "critical",
    "unauthorized_access": "critical",
    "malware_detected": "critical",
    "ransomware_detected": "critical",
    "sql_injection": "critical",
    "command_injection": "critical",
    "remote_code_execution": "critical",
    "data_exfiltration": "critical",
    "lateral_movement": "critical",
    "credential_theft": "critical",
    
    # HIGH - Significant security incident
    "failed_login": "high",
    "multiple_failed_logins": "high",
    "account_lockout": "high",
    "suspicious_login": "high",
    "unusual_activity": "high",
    "port_scan": "port_scan",
    "ddos_attempt": "high",
    "firewall_block": "high",
    "intrusion_detected": "high",
    "policy_violation": "high",
    "file_access_suspicious": "high",
    "registry_modification": "high",
    "process_execution_suspicious": "high",
    
    # MEDIUM - Should be investigated
    "configuration_change": "medium",
    "user_created": "medium",
    "user_deleted": "medium",
    "group_modified": "medium",
    "permission_change": "medium",
    "application_error": "medium",
    "service_stopped": "medium",
    "service_started": "medium",
    "backup_failed": "medium",
    "disk_space_low": "medium",
    "certificate_expired": "medium",
    "password_changed": "medium",
    "login": "low",
    "logout": "low",
    
    # LOW - Informational
    "user_login": "low",
    "user_logout": "low",
    "session_start": "low",
    "session_end": "low",
    "file_created": "low",
    "file_modified": "low",
    "file_deleted": "low",
    "system_startup": "low",
    "system_shutdown": "low",
    "log_rotation": "low",
    "audit_log_cleared": "medium",  # Suspicious
}

def get_severity(event_name: str) -> str:
    """
    Get severity level for an event type
    Returns: 'low', 'medium', 'high', 'critical'
    """
    # Try exact match first
    if event_name in SEVERITY_MAPPING:
        return SEVERITY_MAPPING[event_name]
    
    # Try lowercase
    event_lower = event_name.lower()
    if event_lower in SEVERITY_MAPPING:
        return SEVERITY_MAPPING[event_lower]
    
    # Check if event contains keywords
    if any(word in event_lower for word in ["error", "fail", "attack", "malware", "exploit", "breach"]):
        return "high"
    
    if any(word in event_lower for word in ["success", "complete", "ok", "start", "stop"]):
        return "low"
    
    # Default to low
    return "low"
