const { invoke } = window.__TAURI__.tauri;

import '@material/web/iconbutton/outlined-icon-button.js';

let darkModeToggleEl;
let textFieldEl;
let isDarkMode;

async function pickFile() {
  textFieldEl.value = await invoke("pick_file");
}

function toggleDarkMode() {
  if (isDarkMode) {
    document.documentElement.setAttribute("light_mode", true);
    darkModeToggleEl.icon = "dark_mode";
  } else {
    document.documentElement.removeAttribute("light_mode", false);
    darkModeToggleEl.icon = "light_mode";
  }
  isDarkMode = !isDarkMode;
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
    isDarkMode = true;
  } else {
    isDarkMode = false;
  }
});
