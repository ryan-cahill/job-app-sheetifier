window.onload = () => {
  document.querySelector('#saveSpreadsheetId').addEventListener('click', async () => {
    const spreadsheetId = document.getElementById('spreadsheetId').value;
    await chrome.storage.local.set({ spreadsheetId });
  });
};
