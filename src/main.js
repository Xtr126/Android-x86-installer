import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/textfield/filled-text-field'
import '@material/web/textfield/outlined-text-field'
import { path } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/tauri'
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
  const _installDir = installDirTextFieldEl.value;
  invoke("check_install_dir", { installDir: _installDir, }).then((is_valid) => {
    if (!is_valid) {
      installEl.showDialog('Installation failed', 'Select installation directory to continue');
      return;
    }
    if (!installEl.qemuConfigDone) {
      installEl.showQemuConfigEl(_installDir);
      return;
    }
    invoke("start_install", {  
      isoFile: fileNameTextFieldEl.value,
      installDir: _installDir,
    }).then(() => {
      sidePanelEl.activateNextCategory();
      updateProgress();
    })
    .catch((error) => installEl.showDialog('Installation failed', error))
  });
}

async function updateProgress() {
  while(true) {
    await listen('new-dir-size', (event) => {
      installEl.updateProgress(event.payload)
    });
    if (installEl.progressPercent_ == 100) {
      installEl.activeCategory_ = 'data_img_progress';
      
      if (installEl.osType == 'Windows_NT')  installEl.useDataImg = true;

      if (!installEl.useDataImg) {
        await createGrubEntry();
      } else {
        invoke("create_data_img", {  
          installDir: installDirTextFieldEl.value,
          size: installEl.dataImgSize,
        }).then(async (res) => {
          installEl.showDialog('Create data.img success', res)
          await createGrubEntry();
        }).catch((error) => installEl.showDialog('Create data.img failed', error));
      }
      break;
    }
  }
}

async function createGrubEntry() {
  const _installDir = installDirTextFieldEl.value;
    installEl.bootloaderMsg_ = await invoke("create_grub_entry", {
      installDir: _installDir,
      osTitle: osTitleTextFieldEl.value,
    });
    installEl.installDir = _installDir;
    sidePanelEl.activateNextCategory();
    if (installEl.osType == 'Windows_NT') 
      installEl.activeCategory_ = 'bootloader-windows';
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
  installEl.addEventListener('install', () => startInstall());  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    darkModeToggleEl.selected = true;
  } else {
    darkModeToggleEl.selected = false;
  }
  toggleDarkMode();
});
