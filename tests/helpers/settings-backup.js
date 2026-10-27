const fs = require('node:fs');
const { expect } = require('@playwright/test');

function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
}

function backupChecksum(value) {
  let hash = 2166136261;
  for (const character of stable(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function exportSettingsBackup(page) {
  await page.locator('#settingsBackupExport').click();
  await expect(page.locator('#settingsSafetyTitle')).toHaveText('备份全部设置');
  await expect(page.locator('#settingsSafetyText')).toContainText('工资');
  await expect(page.locator('#settingsSafetyText')).toContainText('明文');
  const downloading = page.waitForEvent('download');
  await page.locator('#settingsSafetyAccept').click();
  const download = await downloading;
  const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(backup.kind).toBe('income-per-sed-settings-backup');
  expect(backup.checksum).toBe(backupChecksum(backup.payload));
  return backup;
}

async function uploadSettingsBackup(page, backup) {
  await page.locator('#settingsBackupFile').setInputFiles({
    name: 'synthetic-settings-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
}

module.exports = { backupChecksum, exportSettingsBackup, uploadSettingsBackup };
