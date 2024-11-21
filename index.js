const axios = require('axios');
const fs = require('fs');

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
      const childResponse = await getChildFolders(response.data[folder].uid);
      folders.push({
        id: response.data[folder].id,
        uid: response.data[folder].uid,
        title: response.data[folder].title,
        folders: childResponse[0],
        dashboards: childResponse[1]
      })
    }
    await getRootDashboards();
    console.log(JSON.stringify(folders, null, 2));
  } catch (error) {
    console.error('Error fetching folders:', error.message);
  }
}

async function getChildFolders(folderUID) {
  let childFolders = [];
  let childDashboards = [];

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
        const childResponse = await getChildFolders(response.data[folder].uid);
        childFolders.push({
          id: response.data[folder].id,
          uid: response.data[folder].uid,
          type: "folder",
          title: response.data[folder].title,
          folders: childResponse[0],
          dashboards: childResponse[1]
        })
      }
      else if (response.data[folder].type === "dash-db")
      {
        childDashboards.push({
          id: response.data[folder].id,
          uid: response.data[folder].uid,
          type: "dashboard",
          title: response.data[folder].title
        });
        await getDashboardDetails(response.data[folder].uid);
      }
    }
  } catch (error) {
    console.error('Error fetching folders:', error.message);
  }

  return [childFolders, childDashboards];
}

async function getRootDashboards() {
  try {
    const response = await axios.get(`${API_HOST}/api/search?type=dash-db`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const filtered = response.data.filter(entry => !("folderUid" in entry));

    for(let item in filtered) {
      folders.push({
        id: filtered[item].id,
        uid: filtered[item].uid,
        type: "dashboard",
        title: filtered[item].title
      });
      await getDashboardDetails(filtered[item].uid);
    }
  } catch (error) {
    console.error('Error fetching dashboards:', error.message);
  }
}

async function getDashboardDetails(dashboardUID) {
  try {
    const response = await axios.get(`${API_HOST}/api/dashboards/uid/${dashboardUID}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    let dashboard = JSON.stringify(response.data.dashboard, null, 2);
    let title = response.data.dashboard.title;

    fs.writeFile(`dashboards/${title}.json`, dashboard, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
      } else {
        console.log("JSON file has been saved successfully!");
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error.message);
  }
}

getRootFolders();