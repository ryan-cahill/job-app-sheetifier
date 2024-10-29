const getNextEmptyRow = async (googleAuthToken, spreadsheetId) => {
  const requestOptions = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${googleAuthToken}`,
    },
  };

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:A1000`, requestOptions);
  const responseJson = await response.json();
  return responseJson.values.length + 1;
};

const postNewRowData = async (googleAuthToken, rowData) => {
  const spreadsheetId = rowData.spreadsheetId;
  const spreadsheetRange = `Sheet1!A${rowData.nextEmptyRow}:H${rowData.nextEmptyRow}`;
  const requestOptions = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${googleAuthToken}`,
      'Content-Type': 'application/json'
    },
    contentType: 'json',
    body: JSON.stringify({
      range: spreadsheetRange,
      majorDimension: 'ROWS',
      values: [ [ rowData.companyName, '', rowData.date, '', '', '', '', rowData.url ] ]
    })
  };

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${spreadsheetRange}?valueInputOption=USER_ENTERED`, requestOptions);
};

const parseNameFromLinkedIn = (pageTitle) => {
  return pageTitle.split(' | ')[1];
};

const sanitizeLinkedInUrl = (url) => { //
  const linkedInUrlRegex = new RegExp('^https://www\.linkedin\.com/jobs/view/\\d+', 'gm');
  return linkedInUrlRegex.exec(url)[0];
};

chrome.action.onClicked.addListener(tab => {
  chrome.storage.local.get(['spreadsheetId'], (storageItems) => {
    const spreadsheetId = storageItems.spreadsheetId;
    if (!spreadsheetId) {
      chrome.tabs.create({ url: 'index.html' });
    } else {
      chrome.identity.getAuthToken({ interactive: true }, (googleAuthToken) => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          const activeTab = tabs[0];
          const nextEmptyRow = await getNextEmptyRow(googleAuthToken, spreadsheetId);
          const currentDate = new Date();
          const companyName = parseNameFromLinkedIn(activeTab.title);
          const postingUrl = sanitizeLinkedInUrl(activeTab.url);
          const rowData = {
            companyName,
            date: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
            url: postingUrl,
            nextEmptyRow,
            spreadsheetId
          };
          await postNewRowData(googleAuthToken, rowData);
        });
      });
    }
  });
});
