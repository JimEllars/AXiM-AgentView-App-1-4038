import { ensureTab, getRows, appendRow } from '../lib/googleSheets';

const TAB = 'SystemLogs';
const HEADERS = ['id', 'timestamp', 'type', 'message', 'severity'];

export const logService = {
  async getAll() {
    await ensureTab(TAB, HEADERS);
    const rows = await getRows(`${TAB}!A2:E`);
    return rows.map(row => ({
      id: row[0],
      timestamp: row[1],
      type: row[2],
      message: row[3],
      severity: row[4]
    })).reverse();
  },

  async add(log) {
    await ensureTab(TAB, HEADERS);
    const row = [
      log.id || Date.now().toString(),
      log.timestamp || new Date().toISOString(),
      log.type,
      log.message,
      log.severity || 'INFO'
    ];
    await appendRow(`${TAB}!A:E`, row);
  }
};