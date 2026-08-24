export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  webViewLink?: string;
}

const BACKUP_FOLDER_NAME = 'Patil Biryani Cloud Backups';

/**
 * Finds or creates the dedicated Patil Biryani backup folder in the user's Google Drive.
 */
export async function getOrCreateBackupFolder(accessToken: string): Promise<string> {
  const q = `name = '${BACKUP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Failed to query Google Drive folder: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Automatic hourly snapshots and backups for Patil Biryani POS & Business Management',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive backup folder: ${errText}`);
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Uploads a complete JSON snapshot to Google Drive inside the backup folder using multipart upload.
 */
export async function uploadBackupToDrive(
  accessToken: string,
  backupPayload: object,
  isAutomatic = false
): Promise<DriveBackupFile> {
  const folderId = await getOrCreateBackupFolder(accessToken);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const prefix = isAutomatic ? 'PatilBiryani_AutoBackup' : 'PatilBiryani_ManualBackup';
  const fileName = `${prefix}_${dateStr}_${timeStr}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
    description: `Patil Biryani ${isAutomatic ? 'Automatic Hourly' : 'Manual'} Database Backup created on ${now.toLocaleString()}`,
  };

  const boundary = '-------PatilBiryaniDriveBoundary314159';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const requestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(backupPayload, null, 2) +
    closeDelimiter;

  const uploadUrl =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,webViewLink';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: requestBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive backup upload failed: ${errorText}`);
  }

  const result: DriveBackupFile = await res.json();
  return result;
}

/**
 * Lists the latest backup snapshots stored in the Google Drive folder.
 */
export async function listDriveBackups(accessToken: string): Promise<DriveBackupFile[]> {
  try {
    const folderId = await getOrCreateBackupFolder(accessToken);
    const q = `'${folderId}' in parents and trashed = false`;
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&orderBy=createdTime desc&pageSize=25&fields=files(id,name,size,createdTime,webViewLink)`;

    const res = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to list Google Drive backups: ${errText}`);
    }

    const data = await res.json();
    return (data.files as DriveBackupFile[]) || [];
  } catch (error) {
    console.error('Error listing backups from Google Drive:', error);
    throw error;
  }
}

/**
 * Downloads and parses the JSON content of a backup file from Google Drive.
 */
export async function downloadDriveBackupContent(
  accessToken: string,
  fileId: string
): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download backup from Google Drive: ${errText}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Deletes a backup snapshot from Google Drive.
 */
export async function deleteDriveBackupFile(
  accessToken: string,
  fileId: string
): Promise<boolean> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to delete backup file from Google Drive: ${errText}`);
  }

  return true;
}
