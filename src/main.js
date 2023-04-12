const { invoke } = window.__TAURI__.tauri;

import '@material/web/iconbutton/standard-icon-button';
import '@material/web/textfield/filled-text-field'
import '@material/web/textfield/outlined-text-field'
import { path } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event'

let darkModeToggleEl;
let fileNameTextFieldEl;
let osTitleTextFieldEl;
let installDirTextFieldEl;
let installEl;
let sidePanelEl;
let fileIsValid = false;
let installDirIsValid = false;

function pickFile() {
  invoke("pick_file").then((res) => {
    fileIsValid = res.is_valid;
    fileNameTextFieldEl.value = res.file_path;
  }).catch((error) => installEl.showDialog('Error', error))
}

function pickFolder() {
  invoke("pick_folder").then((res) => {
    installDirIsValid = res.is_valid;
    if (!installDirIsValid) installDirTextFieldEl.value = 'Cannot use this folder' 
    else installDirTextFieldEl.value = res.file_path;
  }).catch((error) => installEl.showDialog('Error', error))
}

async function startInstall() {
  invoke("start_install", {  
    isoFile: fileNameTextFieldEl.value,
    installDir: installDirTextFieldEl.value,
    osTitle: osTitleTextFieldEl.value,
  }).then(() => {
    sidePanelEl.activateNextCategory();
    updateProgress();
  })
  .catch((error) => installEl.showDialog('Installation failed', error))
}

async function updateProgress() {
  while(true) {
    await listen('new-dir-size', (event) => {
      installEl.updateProgress(event.payload)
    });
    if (installEl.progressPercent_ >= 100) break;
  }
}

function toggleDarkMode() {
  if (!darkModeToggleEl.selected) {
    document.documentElement.setAttribute("light_mode", true);
  } else {
    document.documentElement.removeAttribute("light_mode", false);
  }
}

async function onNextEvent() {
  if (fileIsValid) {
    let title = await path.basename(fileNameTextFieldEl.value);
    osTitleTextFieldEl.value = title.slice(0, 15);
    sidePanelEl.activateNextCategory();
  } else {
    installEl.showDialog('Invalid ISO file', 'Select a valid ISO file to continue');
  } 
}

window.addEventListener("DOMContentLoaded", () => {
  fileNameTextFieldEl = document.getElementById("file-name"); 
  osTitleTextFieldEl = document.getElementById("os-title"); 
  darkModeToggleEl = document.getElementById("dark-light-mode-toggle");
  installDirTextFieldEl = document.getElementById("install-dir");
  installEl = document.getElementById('installer_app');
  sidePanelEl = document.getElementById('left-panel-navigation');
  
  sidePanelEl.addEventListener("category-change", (e) => installEl.onCategoryChange_(e));
  
  darkModeToggleEl.addEventListener("click", () => toggleDarkMode());
  
  installEl.addEventListener('back', () => sidePanelEl.activatePreviousCategory());
  installEl.addEventListener('next', () => onNextEvent());
  installEl.addEventListener('pick-file', () => pickFile());
  installEl.addEventListener('pick-folder', () => pickFolder());
  installEl.addEventListener('install', () => startInstall());  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    darkModeToggleEl.selected = true;
  } else {
    darkModeToggleEl.selected = false;
  }
  toggleDarkMode();
});