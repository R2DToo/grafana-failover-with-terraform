const axios = require('axios');

const API_HOST = 'https://optimiz.grafana.net';
const API_KEY = '<SERVICE_ACCOUNT_TOKEN>';
let folders = [];

async function getRootFolders() {
  try {
    const response = await axios.get(`${API_HOST}/api/folders`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    for(let folder in response.data) {
      console.log(response.data[folder].title);
      const childFolders = await getChildFolders(response.data[folder].uid, '-');
      folders.push({
        id: response.data[folder].id,
        uid: response.data[folder].uid,
        title: response.data[folder].title,
        folders: childFolders
      })
    }
    console.log(JSON.stringify(folders, null, 2));
  } catch (error) {
    console.error('Error fetching folders:', error.message);
  }
}

async function getChildFolders(folderUID, lead) {
  let childFolders = [];

  try {
    const response = await axios.get(`${API_HOST}/api/search?folderUIDs=${folderUID}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    for(let folder in response.data) {
      if (response.data[folder].type === "dash-folder")
      {
        console.log(`${lead}${response.data[folder].title}`);
        const responseFolders = await getChildFolders(response.data[folder].uid, `${lead}-`);
        childFolders.push({
          id: response.data[folder].id,
          uid: response.data[folder].uid,
          title: response.data[folder].title,
          folders: responseFolders
        })
      }
    }
  } catch (error) {
    console.error('Error fetching folders:', error.message);
  }

  return childFolders;
}

getRootFolders();