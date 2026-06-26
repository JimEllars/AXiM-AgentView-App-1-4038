// Mock data aligning with Unified Worker Entity Schema
export const MOCK_WORKERS = [
  {
    "agent_id": "usr_agent_9a73f8be21",
    "identity_profile": {
      "display_name": "Greta Alpha-Node",
      "classification_type": "AI_AGENT", 
      "engagement_tier": "INTERNAL" 
    },
    "operational_capability": {
      "skills": ["code_generation", "schema_validation", "edge_deployment"],
      "current_status": "ACTIVE_UTILIZATION",
      "assigned_job_id": "job_core_7301_enrichment"
    },
    "ecosystem_context": {
      "ingest_origin": "AXIM_CORE_SYSTEM", 
      "associated_billing_rate_cents": 0
    }
  },
  {
    "agent_id": "usr_human_4b92c1df",
    "identity_profile": {
      "display_name": "Alex Mercer",
      "classification_type": "HUMAN_1099", 
      "engagement_tier": "EXTERNAL" 
    },
    "operational_capability": {
      "skills": ["qa_testing", "data_labeling", "copywriting"],
      "current_status": "IDLE",
      "assigned_job_id": null
    },
    "ecosystem_context": {
      "ingest_origin": "GIG_BOARD_SCRAPER", 
      "associated_billing_rate_cents": 4500
    }
  },
  {
    "agent_id": "usr_agent_8x22o9pq",
    "identity_profile": {
      "display_name": "Onyx Swarm-Node",
      "classification_type": "AI_AGENT", 
      "engagement_tier": "INTERNAL" 
    },
    "operational_capability": {
      "skills": ["anomaly_detection", "triage", "log_aggregation"],
      "current_status": "IDLE",
      "assigned_job_id": null
    },
    "ecosystem_context": {
      "ingest_origin": "AXIM_CORE_SYSTEM", 
      "associated_billing_rate_cents": 0
    }
  }
];

export const MOCK_TASKS = [
  {
    "task_id": "job_core_7301_enrichment",
    "title": "Schema Enrichment Pipeline",
    "priority": "HIGH",
    "required_skills": ["schema_validation", "code_generation"],
    "status": "IN_PROGRESS",
    "assigned_agent": "usr_agent_9a73f8be21"
  },
  {
    "task_id": "job_gig_8822_qa",
    "title": "Edge Gateway Proxy Testing",
    "priority": "CRITICAL",
    "required_skills": ["qa_testing"],
    "status": "UNASSIGNED",
    "assigned_agent": null
  },
  {
    "task_id": "job_core_9912_triage",
    "title": "Telemetry Log Aggregation",
    "priority": "MEDIUM",
    "required_skills": ["log_aggregation", "triage"],
    "status": "UNASSIGNED",
    "assigned_agent": null
  }
];