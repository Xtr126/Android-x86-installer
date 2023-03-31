const { invoke } = window.__TAURI__.tauri;

import '@material/web/iconbutton/standard-icon-button-toggle';
import { path } from '@tauri-apps/api';

let darkModeToggleEl;
let fileIsValid = false;
let fileNameTextFieldEl;
let osTitleTextFieldEl;

async function pickFile() {
  invoke("pick_file").then((res) => {
    fileIsValid = res.is_valid;
    fileNameTextFieldEl.value = res.file_path;
  })
}

function toggleDarkMode() {
  if (!darkModeToggleEl.selected) {
    document.documentElement.setAttribute("light_mode", true);
  } else {
    document.documentElement.removeAttribute("light_mode", false);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  fileNameTextFieldEl = document.getElementById("file-name"); 
  osTitleTextFieldEl = document.getElementById("os-title"); 
  
  darkModeToggleEl = document.getElementById("dark-light-mode-toggle");
  darkModeToggleEl.addEventListener("click", () => toggleDarkMode());
  
  const sidePanelEl = document.getElementById('left-panel-navigation');
  sidePanelEl.addEventListener("category-change", (e) => installEl.onCategoryChange_(e));
  
  const installEl = document.getElementById('installer_app');
  installEl.addEventListener('next', async () => { 
    if (fileIsValid) {
      let title = await path.basename(fileNameTextFieldEl.value);
      osTitleTextFieldEl.value = title.slice(0, 15);
      sidePanelEl.activateNextCategory();
    } else fileNameTextFieldEl.value = 'Invalid ISO File' 
  });
  installEl.addEventListener('back', () => sidePanelEl.activatePreviousCategory());
  installEl.addEventListener('pick-file', () => pickFile());

  if(window.matchMedia('(prefers-color-scheme: dark)').matches){
    darkModeToggleEl.selected = true;
  } else {
    darkModeToggleEl.selected = false;
  }
  toggleDarkMode();
});
