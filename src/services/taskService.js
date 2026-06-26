import { ensureTab, getRows, appendRow, updateRow, findRowIndexById, deleteRow } from '../lib/googleSheets';

const TAB = 'Tasks';
const HEADERS = ['id', 'title', 'priority', 'required_skills', 'status', 'assigned_agent', 'created_at', 'updated_at'];

export const taskService = {
  async getAll() {
    await ensureTab(TAB, HEADERS);
    const rows = await getRows(`${TAB}!A2:H`);
    return rows.map(row => ({
      task_id: row[0],
      title: row[1],
      priority: row[2],
      required_skills: row[3] ? JSON.parse(row[3]) : [],
      status: row[4],
      assigned_agent: row[5] || null,
      created_at: row[6],
      updated_at: row[7]
    }));
  },

  async create(task) {
    await ensureTab(TAB, HEADERS);
    const id = task.task_id || `job_${crypto.randomUUID().split('-')[0]}`;
    const now = new Date().toISOString();
    const row = [
      id,
      task.title,
      task.priority,
      JSON.stringify(task.required_skills),
      task.status || 'UNASSIGNED',
      task.assigned_agent || '',
      now,
      now
    ];
    await appendRow(`${TAB}!A:H`, row);
    return { ...task, task_id: id };
  },

  async updateStatus(taskId, status, agentId = null) {
    const idx = await findRowIndexById(TAB, taskId);
    if (idx < 0) return;
    const rows = await getRows(`${TAB}!A${idx}:H${idx}`);
    if (!rows.length) return;
    const row = [...rows[0]];
    row[4] = status;
    if (agentId !== undefined) row[5] = agentId || '';
    row[7] = new Date().toISOString();
    await updateRow(`${TAB}!A${idx}:H${idx}`, row);
  },

  async delete(id) {
    return await deleteRow(TAB, id);
  }
};