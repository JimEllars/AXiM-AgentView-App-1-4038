import { ensureTab, getRows, appendRow, updateRow, findRowIndexById, deleteRow } from '../lib/googleSheets';

const TAB = 'Agents';
const HEADERS = [
  'id', 'display_name', 'classification_type', 'engagement_tier', 
  'skills', 'current_status', 'assigned_job_id', 'ingest_origin', 
  'created_at', 'updated_at'
];

export const agentService = {
  async getAll() {
    await ensureTab(TAB, HEADERS);
    const rows = await getRows(`${TAB}!A2:J`);
    return rows.map(row => ({
      agent_id: row[0],
      identity_profile: {
        display_name: row[1],
        classification_type: row[2],
        engagement_tier: row[3]
      },
      operational_capability: {
        skills: row[4] ? JSON.parse(row[4]) : [],
        current_status: row[5],
        assigned_job_id: row[6] || null
      },
      ecosystem_context: {
        ingest_origin: row[7],
        created_at: row[8],
        updated_at: row[9]
      }
    }));
  },

  async create(agent) {
    await ensureTab(TAB, HEADERS);
    const id = agent.agent_id || crypto.randomUUID();
    const now = new Date().toISOString();
    const row = [
      id,
      agent.identity_profile.display_name,
      agent.identity_profile.classification_type,
      agent.identity_profile.engagement_tier,
      JSON.stringify(agent.operational_capability.skills),
      agent.operational_capability.current_status || 'IDLE',
      agent.operational_capability.assigned_job_id || '',
      agent.ecosystem_context.ingest_origin,
      now,
      now
    ];
    await appendRow(`${TAB}!A:J`, row);
    return { ...agent, agent_id: id };
  },

  async updateStatus(id, status, jobId = null) {
    const idx = await findRowIndexById(TAB, id);
    if (idx < 0) return;
    const rows = await getRows(`${TAB}!A${idx}:J${idx}`);
    if (!rows.length) return;
    const row = [...rows[0]];
    row[5] = status;
    row[6] = jobId || '';
    row[9] = new Date().toISOString();
    await updateRow(`${TAB}!A${idx}:J${idx}`, row);
  },

  async delete(id) {
    return await deleteRow(TAB, id);
  }
};