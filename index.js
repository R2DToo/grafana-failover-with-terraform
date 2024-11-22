const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_HOST = 'https://optimiz.grafana.net';
const API_KEY = '<SERVICE_ACCOUNT_KEY>';
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
        type: "folder",
        title: response.data[folder].title,
        folders: childResponse[0],
        dashboards: childResponse[1]
      })
    }
    await getRootDashboards();
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
    }
  } catch (error) {
    console.error('Error fetching dashboards:', error.message);
  }
}

async function getDashboardDetails(dashboardUID, folderPath) {
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
    title = title.replace(/\//g, "-");

    const filePath = path.join(folderPath, `${title}.json`);

    fs.writeFile(filePath, dashboard, (err) => {
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

async function setupDashboardRepo() {
  const root = path.join(__dirname, 'dashboards');

  clearFolder(root);
  console.log(JSON.stringify(folders, null, 2));
  for(let item in folders) {
    if (folders[item].type === "folder")
    {
      const folderPath = path.join(root, `${folders[item].title}`);

      await fs.mkdirSync(folderPath);
      await setupChildDashboardRepo(folders[item], folderPath);
    }
    else if (folders[item].type === "dashboard")
    {
      await getDashboardDetails(folders[item].uid, root);
    }
  }
}

function clearFolder(folderPath) {
  try {
    if (fs.existsSync(folderPath)) {
      // Read all files and subfolders in the directory
      const files = fs.readdirSync(folderPath);

      // Iterate and delete each file or folder
      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const stats = fs.lstatSync(filePath);

        if (stats.isDirectory()) {
          // Recursively remove subdirectories
          clearFolder(filePath);
          fs.rmdirSync(filePath); // Remove the directory
        } else {
          fs.unlinkSync(filePath); // Remove the file
        }
      });
      console.log(`Cleared all contents of folder: ${folderPath}`);
    } else {
      console.log(`Folder does not exist: ${folderPath}`);
    }
  } catch (err) {
    console.error(`Error clearing folder: ${err.message}`);
  }
}

async function setupChildDashboardRepo(parentFolder, parentFolderPath) {
  for (let folder in parentFolder.folders) {
    const folderPath = path.join(parentFolderPath, `${parentFolder.folders[folder].title}`);

    await fs.mkdirSync(folderPath);
    await setupChildDashboardRepo(parentFolder.folders[folder], folderPath);
  }

  for (let dashboard in parentFolder.dashboards) {
    await getDashboardDetails(parentFolder.dashboards[dashboard].uid, parentFolderPath);
  }
}

async function main() {
  await getRootFolders();
  await setupDashboardRepo();
}

main();