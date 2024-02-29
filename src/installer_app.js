import {LitElement, css, html} from 'lit';

import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/filled-button';
import '@material/web/button/outlined-button';
import '@material/web/button/text-button';
import '@material/web/dialog/dialog';
import '@material/web/progress/circular-progress';
import '@material/web/elevation/elevation'
import '@material/web/switch/switch'
import '@material/web/slider/slider'
import { msg } from '@lit/localize'

import { exit } from '@tauri-apps/api/process';

import androidLogo from './assets/android.svg'
import { type } from '@tauri-apps/api/os';

export class InstallerApp extends LitElement {

  /** @override */
  static properties = {
    activeCategory_: {type: String},
    dialogTitle_: {type: String},
    dialogMsg_: {type: String},
    progressPercent_: {type: Number},
    bootloaderMsg_: {type: String},
    installDir: {type: String},
    useDataImg: {type: Boolean},
    dataImgSize: {type: Number},
    dataImgScale: {type: Number},
    qemuConfigDone: {type: Boolean},
    osType: {type: String},
  };

  constructor() {
    super();
    this.activeCategory_ = 'install';
    this.progressPercent_ = 0;
    this.dataImgSize = 4;
    this.dataImgScale = 2;
    this.qemuConfigDone = false;
    this.bootloaderMsg_ = 
`  menuentry "Android" --class android-x86 {
    savedefault
    search --no-floppy --set=root --file /boot/grub/grub.cfg
    configfile /boot/grub/grub.cfg
  }`;
  }

  /** @override */
  static styles = css`
    .container {
      margin: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
    
    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
      transition: 0.75s;
    }
    
    .logo.android:hover {
      filter: drop-shadow(0 0 2em #2f8a36);
    }
    
    .row {
      display: flex;
      justify-content: center;
    }
    
    h1 {
      text-align: center;
    }
    
    .installer-app-category {
      display: none;
      background-color: var(--md-sys-color-background);
      color: var(--md-sys-color-on-background);
    }
    .installer-app-category[active-category] {
      display: block;
    }

    .button-back {
      position: fixed;
      bottom: 0;
      margin-bottom: 20px;
    }

    .button-next {
      position: fixed;
      bottom: 0;
      right: 0;
      margin-right: 20px;
      margin-bottom: 20px;
    }

    .c-progress {
      margin: auto;
      --md-circular-progress-size: 40vh;
      --md-circular-progress-active-indicator-width: 6;
    }

    .c-progress.container {
      height: 80vh;
      width: 60vh;
    }

    .codeblock-surface {
      background-color: var(--md-sys-color-surface-container-high);
      border-radius: 1em;
      border-width: 1px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      color: var(--md-sys-color-on-surface-variant);
      text-shadow: 0 1px 1px var(--md-sys-color-surface);
      font-family: 'Google Sans Mono', 'Droid Sans Mono', 'Roboto Mono', Menlo, Monaco, 'Courier New', monospace;
      font-size: 14px;
      tab-size: 2;
      line-height: 1.5;
      --md-elevation-level: 5;
    }

    .copy-button {
      display: flex;
      border-radius: 9999px;
      --md-sys-color-on-surface-variant: var(--md-sys-color-on-surface);
      position: absolute;
      justify-content: center;
      align-items: center;
      width: 2.5rem;
      height: 2.5rem;
      outline: 2px solid transparent;
      outline-offset: 2px;
      top: 0;
      right: 0;
    }

    .settings-form {
      justify-content: start; 
      margin-left: 60px;
    }

    .settings-form > *:not(:last-child) {
      margin-bottom: 30px;
    }`  

  /** @override */
  render() {
    return html`
    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'install'}">
      
        <div class="container on-background-text">
          <h1>Install Android™ on your PC</h1>
    
          <div class="row">
            <a target="_blank">
              <img src=${androidLogo} class="logo android" alt="Android logo" />
            </a>
          </div>
    
          <p class="label-large" style="margin-bottom: 15px;">${msg('Select your Android x86 Installation media or .ISO file to continue')}</p>
    
          <div class="row label">
            <div>
              <slot name="file_name"></slot>
              <md-icon-button @click="${this.onFileButtonClicked}" style="margin-left: -62px; margin-top: 3px; position: fixed;"> <md-icon>folder_open</md-icon> </md-icon-button>
              <md-filled-tonal-button @click="${this.onNextButtonClicked}" id="start-button" >${msg('Start')}</md-filled-tonal-button>
            </div>
          </div>
    
        </div>
    </section>

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'settings'}">
      <div class="column settings-form">
        <slot name="os_title"></slot>
        
        <div>
          <slot name="install_dir"></slot>
          <md-icon-button @click="${this.onFolderButtonClicked}"> 
            <md-icon>folder_open</md-icon> 
          </md-icon-button>
        </div>

        <div>
          <label style="margin-right: 40px;">${msg('Create /data directory')}</label> 
          <md-switch selected @change="${this.dataDirSwitchClicked}" id="data-dir-switch"></md-switch>
        </div>

        <div style="margin-top: -10px;">
          <label style="margin-right: 80px;">${msg('Create data.img')}</label> 
          <md-switch @change="${this.dataImgSwitchClicked}" id="data-img-switch"></md-switch>
        </div>

        <div style="margin-top: -40px; display: none;" id="c-data-img"> 
          <label>Size: ${this.dataImgSize} GB</label> 
          <md-slider @change=${this.handleDataImgSize_Change} step=${this.dataImgScale} min=4 max=${this.dataImgScale * 16} value=4 ticks labeled style="width: 300px;"></md-slider>
          <md-outlined-text-field @change=${this.handleDataImgScale_Change} onKeyDown="return false" label="Scale" min="1" type="number" style="width:80px" value=2></md-outlined-text-field>
        </div>

        <div style="margin-top: -10px;">
          <label style="margin-right: 80px;">${msg('Install for QEMU')} </label> 
          <md-switch @change="${this.qemuInstallSwitchClicked}" id="qemu-install-switch"></md-switch>
        </div>

      </div>
      <md-outlined-button class="button-back" @click="${this.onBackButtonClicked}">${msg('Back')}</md-outlined-button>
      <md-filled-button class="button-next" @click="${this.onInstallButtonClicked}">Install</md-filled-button>
    </section>
    
    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'progress'}">
      <div class="container c-progress">
        <md-circular-progress class="c-progress" id="circular-progress"> </md-circular-progress>
        <p style="margin: auto;"> ${msg('Extracting ISO')} ${this.progressPercent_}% </p>
      </div>
    </section>  

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'bootloader'}">
      <div class="display-small" style="margin-left: 50px;">
        <li>${msg('Open /etc/grub.d/40_custom or /boot/grub/grub.cfg in a text editor')}</li><br>
        <div>${msg('Example:')}</div>
        <div class="codeblock-surface" > 
        <pre><code>  sudo nano /etc/grub.d/40_custom</code></pre>
        </div>
        <li>${msg('Create a new grub entry with the following code: ')}</li>
        <div class="codeblock-surface">
        <md-elevation></md-elevation>
        <div style="position: relative" title="Copy">
        <md-icon-button class="copy-button" @click="${this.copyCode}">
          <md-icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="-3 -4 30 30" role="presentation"><g fill="currentColor"><g><path d="M20 8h-9c-1.65 0-3 1.35-3 3v9c0 1.65 1.35 3 3 3h9c1.65 0 3-1.35 3-3v-9c0-1.65-1.35-3-3-3zm1 12c0 .55-.45 1-1 1h-9c-.55 0-1-.45-1-1v-9c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v9z"></path><path d="M5 14H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v1c0 .55.45 1 1 1s1-.45 1-1V4c0-1.65-1.35-3-3-3H4C2.35 1 1 2.35 1 4v9c0 1.65 1.35 3 3 3h1c.55 0 1-.45 1-1s-.45-1-1-1z"></path></g></g></svg>
          </md-icon>
        </md-icon-button>
        </div>
        <pre><code>${this.bootloaderMsg_}</code></pre>
        </div>
        <li>${msg(' After editing /etc/grub.d/40_custom, re-generate grub config with command:')}</li>
        <div class="codeblock-surface" > 
        <pre><code>  sudo grub-mkconfig -o /boot/grub/grub.cfg</code></pre>
        </div>
        <p>${msg('The exact command to use may vary depending on your distro.')}</p>
      </div>
      <md-filled-button class="button-next" @click="${this.onFinishButtonClicked}">${msg('Done')}</md-filled-button>
    </section>

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'bootloader-windows'}">
      <div class="display-small" style="margin-left: 50px;">
        <div>${msg('Only Bliss OS Grub can read from NTFS partitions.')}</div>
        <div>${msg('Compression should be disabled in properties for the partition.')}</div><br>

        <div>${msg('Press Win+X and select Windows Terminal (Admin)')}</div>
        <div>${msg('Open PowerShell by typing in below command and press enter key.')}</div>
        <div class="codeblock-surface" > 
          <pre><code>  powershell.exe</code></pre>
        </div>
        <div>${msg('Right click to paste text into the terminal.')}</div><br>
        <div>${msg('Mount EFI System partition')}</div>
          <div class="codeblock-surface" > 
            <pre><code>  mountvol X: /s</code></pre>
          </div>
        <div>${msg('Copy Android bootloader files')}</div>
          <div class="codeblock-surface" > 
            <pre><code>  Copy-Item -Path ${this.installDir}\\boot -Destination X:\\ -Recurse</code></pre>
            <pre><code>  Copy-Item -Path ${this.installDir}\\efi\\boot -Destination X:\EFI\\ -Recurse</code></pre>
          </div>

        <div>${msg('Create bootloader entry for Android')}</div>
        <div class="codeblock-surface" > 
          <pre><code>  Copy-BcdEntry -Description "Android" -SourceEntryId bootmgr -TargetStore X:\\EFI\\Microsoft\\Boot\\BCD</code></pre>
        </div>

        <div>${msg('Use x-x-xxxx-xxxxx from identifier {x-x-xxxx-xxxxx} in output from previous command.')}</div>
        <div class="codeblock-surface" > 
          <pre><code>  Set-BcdElement -Element path -Id x-x-xxxx-xxxxx -Type String -Value \\EFI\\boot\\BOOTx64.EFI</code></pre>
        </div>

        <div>${msg('Disable hibernation using PowerShell to avoid bootloop.')}</div>
        <div>${msg('If turning off hibernation is undesirable, hold down shift key when shutting down Windows to perform a full shutdown, everytime before booting to Android.')}</div>
        <div class="codeblock-surface" > 
          <pre><code>  powercfg.exe /hibernate off</code></pre>
        </div>

        <div>${msg('Boot to Android from UEFI Boot Menu in BIOS.')}</div>
        <div>${msg('Or press Ctrl+Alt+Del, click on power button and hold shift key while clicking on restart. After restarting, select "Use another device" or "Use another operating system" from the menu and select "Android".')}</div>

      </div>
      <md-filled-button class="button-next" @click="${this.onFinishButtonClicked}">${msg('Done')}</md-filled-button>
    </section>


    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'qemu_settings'}">
    <div class="column settings-form">
      <qemu-config></qemu-config>
      </div>
      <md-outlined-button class="button-back" @click="${this.onQemuConfigCancel}">${msg('Back')}</md-outlined-button>
      <md-filled-button class="button-next" @click="${this.onQemuConfigDoneButtonClicked}">${msg('Done')}</md-filled-button>
    </section>


    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'data_img_progress'}">
      <div class="container c-progress">
        <md-circular-progress class="c-progress" indeterminate four-color	> </md-circular-progress>
        <p style="margin: auto;"> ${msg('Creating data.img.. Please wait')}</p>
      </div>
    </section>

    <md-dialog id="dialog">
      <div slot="headline">
        ${this.dialogTitle_}
      </div>
      <div slot="content">
        ${this.dialogMsg_}  
      </div>
      <div slot="actions">
        <md-text-button @click="${this.closeDialog}" slot="footer">OK</md-text-button>
      </div>
    </md-dialog>
    `;
  }

  /**
   * @param {!Event} e
   * @private
   */
  onCategoryChange_(e) {
    this.activeCategory_ = e.detail.category;
  }

  onFileButtonClicked() {
    this.dispatchEvent(new CustomEvent('pick-file'));
  }

  onFolderButtonClicked() {
    this.dispatchEvent(new CustomEvent('pick-folder'));
  }

  onBackButtonClicked() {
    this.dispatchEvent(new CustomEvent('back'));
  }

  onNextButtonClicked() {
    this.dispatchEvent(new CustomEvent('next'));
  }

  onInstallButtonClicked() {
    if (!this.qemuInstallSwitchEl.selected) this.qemuConfigDone = true;
    this.dispatchEvent(new CustomEvent('install'));
  }

  showDialog(dialogTitle, dialogMsg) {
    this.dialogTitle_ = dialogTitle;
    this.dialogMsg_ = dialogMsg;
    this.dialog.show();
  }

  async onFinishButtonClicked() {
    await exit(0);
  }

  closeDialog() {
    this.dialog.close();
  }

  updateProgress(progress) {
    this.progressPercent_ = progress;
    this.circularProgress.value = progress / 100;
  }

  async copyCode() {
    await navigator.clipboard.writeText(this.bootloaderMsg_);
    this.circularProgress = this.renderRoot.querySelector('#circular-progress');
    this.showDialog('Copied to clipboard', this.bootloaderMsg_);
  }
  
  dataImgSwitchClicked() {
    this.dataDirSwitchEl.selected = !this.dataImgSwitchEl.selected;  
    this.dataImgSwitchState();
  }

  dataDirSwitchClicked() {
    this.dataImgSwitchEl.selected = !this.dataDirSwitchEl.selected;  
    this.dataImgSwitchState();
  }
  
  qemuInstallSwitchClicked() {
    const installForQemu = this.qemuInstallSwitchEl.selected;
    if (installForQemu) {
      this.dataImgSwitchEl.selected = true;  
      this.dataDirSwitchEl.selected = false;  
      this.dataImgSwitchState();
    }
    if (this.osType != 'Windows_NT')
      this.dataDirSwitchEl.disabled = this.dataImgSwitchEl.disabled = installForQemu;
  }

  onQemuConfigDoneButtonClicked() {
    this.qemuConfigDone = true;
    const qemuConfigEl = this.renderRoot.querySelector("qemu-config"); 
    qemuConfigEl.invokeInstall(this, this.installDir);
    this.onInstallButtonClicked();
  }

  onQemuConfigCancel() {
    this.activeCategory_ = 'settings';
  }

  showQemuConfigEl(installDir) {
    this.activeCategory_ = 'qemu_settings';
    this.installDir = installDir;
  }

  dataImgSwitchState() {
    this.useDataImg = this.dataImgSwitchEl.selected;  
    if (this.useDataImg) {
      this.dataImg.style.display = "block";
    } else {
      this.dataImg.style.display = "none";
    }
  }

  handleDataImgSize_Change(event) {
    this.dataImgSize = event.target.value;
  }

  handleDataImgScale_Change(event) {
    this.dataImgScale = event.target.value;
  }

  /** @override */
  firstUpdated() {
    this.dialog = this.renderRoot.querySelector('#dialog');
    this.circularProgress = this.renderRoot.querySelector('#circular-progress');
    this.dataImg = this.renderRoot.querySelector('#c-data-img');
    this.dataDirSwitchEl = this.renderRoot.querySelector('#data-dir-switch'); 
    this.dataImgSwitchEl = this.renderRoot.querySelector('#data-img-switch'); 
    this.qemuInstallSwitchEl = this.renderRoot.querySelector('#qemu-install-switch'); 
    this.showDialog('', '"The Android robot is reproduced or modified from work created and shared by Google and used according to terms described in the Creative Commons 3.0 Attribution License."');
    type().then((osType) => {
      this.osType = osType;
      if (this.osType == 'Windows_NT') {
        this.dataImgSwitchEl.selected = true;  
        this.dataDirSwitchEl.selected = false;  
        this.dataDirSwitchEl.disabled = true;
        this.dataImgSwitchState();
      }
    })
  }  
}

customElements.define('installer-app', InstallerApp);