const { invoke } = window.__TAURI__.tauri;

import '@material/web/iconbutton/standard-icon-button-toggle';

let darkModeToggleEl;
let textFieldEl;

async function pickFile() {
  textFieldEl.value = await invoke("pick_file");
}

function toggleDarkMode() {
  if (!darkModeToggleEl.selected) {
    document.documentElement.setAttribute("light_mode", true);
  } else {
    document.documentElement.removeAttribute("light_mode", false);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  textFieldEl = document.getElementById("text-filename"); 
  
  darkModeToggleEl = document.getElementById("dark-light-mode-toggle");
  darkModeToggleEl.addEventListener("click", () => toggleDarkMode());
  
  const sidePanelEl = document.getElementById('left-panel-navigation');
  sidePanelEl.addEventListener("category-change", (e) => installEl.onCategoryChange_(e));
  
  const installEl = document.getElementById('installer_app');
  installEl.addEventListener('next', () => sidePanelEl.activateNextCategory());
  installEl.addEventListener('back', () => sidePanelEl.activatePreviousCategory());

  installEl.addEventListener('pick-file', () => pickFile());

  if(window.matchMedia('(prefers-color-scheme: dark)').matches){
    darkModeToggleEl.selected = true;
  } else {
    darkModeToggleEl.selected = false;
  }
  toggleDarkMode();
});
