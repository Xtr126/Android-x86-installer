const { invoke } = window.__TAURI__.tauri;

import '@material/web/iconbutton/standard-icon-button-toggle';
import '@material/web/textfield/filled-text-field'
import '@material/web/textfield/outlined-text-field'
import { path } from '@tauri-apps/api';

let darkModeToggleEl;
let fileNameTextFieldEl;
let osTitleTextFieldEl;
let installDirTextFieldEl;
let fileIsValid = false;
let installDirIsValid = false;

async function pickFile() {
  invoke("pick_file").then((res) => {
    fileIsValid = res.is_valid;
    fileNameTextFieldEl.value = res.file_path;
  })
}

async function pickFolder() {
  invoke("pick_folder").then((res) => {
    installDirIsValid = res.is_valid;
    if (!installDirIsValid) installDirTextFieldEl.value = 'Cannot use this folder' 
    else installDirTextFieldEl.value = res.file_path;
  })
}

function toggleDarkMode() {
  if (!darkModeToggleEl.selected) {
    document.documentElement.setAttribute("light_mode", true);
  } else {
    document.documentElement.removeAttribute("light_mode", false);
  }
}

async function onNextEvent(sidePanelEl, installEL) {
  if (fileIsValid) {
    let title = await path.basename(fileNameTextFieldEl.value);
    osTitleTextFieldEl.value = title.slice(0, 15);
    sidePanelEl.activateNextCategory();
  } else {
    fileNameTextFieldEl.value = 'Invalid ISO File'
    installEL.showDialog();
  } 
}

window.addEventListener("DOMContentLoaded", () => {
  fileNameTextFieldEl = document.getElementById("file-name"); 
  osTitleTextFieldEl = document.getElementById("os-title"); 
  darkModeToggleEl = document.getElementById("dark-light-mode-toggle");
  installDirTextFieldEl = document.getElementById("install-dir");

  const sidePanelEl = document.getElementById('left-panel-navigation');
  const installEl = document.getElementById('installer_app');
  
  sidePanelEl.addEventListener("category-change", (e) => installEl.onCategoryChange_(e));
  
  darkModeToggleEl.addEventListener("click", () => toggleDarkMode());
  
  installEl.addEventListener('back', () => sidePanelEl.activatePreviousCategory());
  installEl.addEventListener('next', () => onNextEvent(sidePanelEl, installEl));
  installEl.addEventListener('pick-file', () => pickFile());
  installEl.addEventListener('pick-folder', () => pickFolder());

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    darkModeToggleEl.selected = true;
  } else {
    darkModeToggleEl.selected = false;
  }
  toggleDarkMode();
});
