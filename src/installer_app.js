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
import { exit } from '@tauri-apps/plugin-process';
import { type } from '@tauri-apps/plugin-os';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { invoke } from '@tauri-apps/api/core'

export class InstallerApp extends LitElement {

  /** @override */
  static properties = {
    activeCategory_: {type: String},
    dialogTitle_: {type: String},
    dialogMsg_: {type: html},
    circularProgressPercent: {type: Number},
    bootloaderMsg_: {type: String},
    installDir: {type: String},
    useDataImg: {type: Boolean},
    dataImgSize: {type: Number},
    qemuConfigDone: {type: Boolean},
    osType: {type: String},
    bootloaderInstallProgram: {type: String},

    megaBytesRead: {type: Number},
    readSpeedMBps: {type: Number},
    megaBytesWritten: {type: Number},
    writeSpeedMBps: {type: Number},
    megaBytesTotal: {type: Number},
  };

  constructor() {
    super();
    this.activeCategory_ = 'install';
    this.dataImgSize = 4;
    this.dataImgScale = 2;
    this.qemuConfigDone = false;
    this.bootloaderMsg_ = 
  `menuentry "Android" --class android-x86 {
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
      padding: 3em;
      padding-bottom: 3em;
      will-change: filter;
      transition: 0.75s;
      fill: var(--md-sys-color-primary);
      filter: drop-shadow(0px 0px 50px var(--md-sys-color-primary));
    }
    
    .row {
      display: flex;
      justify-content: center;
    }
    
    h1 {
      text-align: center;
    }

    summary {
      font-weight: 500;
      font-size: 18px;
      margin-top: 1em;
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
      --md-circular-progress-size: 80vh;
      --md-circular-progress-active-indicator-width: 6;
    }
    
    .c-progress.container {
      align-items: center;
      margin-bottom: -10vh;
    }
    
    .c-progress.bytes {
      width: var(--md-circular-progress-size);
      height: var(--md-circular-progress-size);
      font-size: 13px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: -30vh;
      position: absolute;
    }

    #circular-progress {
      rotate: -135deg;
      filter: drop-shadow(0 0 1em var(--md-sys-color-on-surface-variant));
    }
    
    .codeblock-surface {
      background-color: var(--md-sys-color-surface-container-high);
      border-radius: 1em;
      border-width: 1px;
      margin: 1rem;
      overflow-x: auto;
      color: var(--md-sys-color-on-surface-variant);
      text-shadow: 0 1px 1px var(--md-sys-color-surface);
      font-family: 'Google Sans Mono', 'Droid Sans Mono', 'Roboto Mono', Menlo, Monaco, 'Courier New', monospace;
      font-size: 14px;
      tab-size: 2;
      line-height: 1.5;
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
    }
    `  

  /** @override */
  render() {
    return html`
    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'install'}">
      
        <div class="container on-background-text">
          <h1>Install Android™ on your PC</h1>

           <!-- Based on https://github.com/BlissLabs-Infra/artwork/blob/35c35ca026fb150688c7e5978ba219922a800317/Projects/Bliss%20OS/logo/BlissOS_logo_black.svg -->
          <span class="logo"><svg width="10em" height="6em" viewBox="0 0 291 218" xmlns="http://www.w3.org/2000/svg">
            <path d="M150.204 218C189.689 213.228 226.854 194.735 253.735 162.986C280.614 131.236 292.537 91.7516 290.422 52.3854C250.937 57.1565 213.773 75.6496 186.892 107.399C160.012 139.149 148.089 178.633 150.204 218Z" />
            <path d="M150.204 218C189.689 213.228 226.854 194.735 253.735 162.986C280.614 131.236 292.537 91.7516 290.422 52.3854C250.937 57.1565 213.773 75.6496 186.892 107.399C160.012 139.149 148.089 178.633 150.204 218Z" />
            <path d="M140.456 218C142.572 178.634 130.649 139.149 103.769 107.399C76.8879 75.6499 39.7232 57.1567 0.238694 52.3856C-1.87674 91.7518 10.0459 131.237 36.9265 162.986C63.8074 194.736 100.972 213.228 140.456 218Z" />
            <path d="M140.456 218C142.572 178.634 130.649 139.149 103.769 107.399C76.8879 75.6499 39.7232 57.1567 0.238694 52.3856C-1.87674 91.7518 10.0459 131.237 36.9265 162.986C63.8074 194.736 100.972 213.228 140.456 218Z" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M173.461 40.494C166.264 25.6804 156.775 12.0501 145.418 0C134.03 12.083 124.52 25.7552 117.315 40.6158C128.39 52.0504 137.877 65.1476 145.329 79.7221C152.808 65.0958 162.336 51.9574 173.461 40.494Z" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M173.461 40.494C166.264 25.6804 156.775 12.0501 145.418 0C134.03 12.083 124.52 25.7552 117.315 40.6158C128.39 52.0504 137.877 65.1476 145.329 79.7221C152.808 65.0958 162.336 51.9574 173.461 40.494Z" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M55.6857 61.1141C57.3279 44.7132 61.5455 28.6474 68.0753 13.4378C99.758 29.4034 125.919 55.0365 141.334 88.0994C139.946 91.2451 138.65 94.4531 137.449 97.7221C133.328 108.944 130.532 120.345 128.985 131.769C123.599 121.586 117.049 111.84 109.314 102.704C94.122 84.7599 75.803 70.8759 55.6857 61.1141Z" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M55.6857 61.1141C57.3279 44.7132 61.5455 28.6474 68.0753 13.4378C99.758 29.4034 125.919 55.0365 141.334 88.0994C139.946 91.2451 138.65 94.4531 137.449 97.7221C133.328 108.944 130.532 120.345 128.985 131.769C123.599 121.586 117.049 111.84 109.314 102.704C94.122 84.7599 75.803 70.8759 55.6857 61.1141Z" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M234.973 61.1151C233.33 44.7137 229.113 28.6476 222.583 13.4378C187.126 31.3053 158.585 61.2808 144.282 100.227C138.92 114.828 135.908 129.738 135.059 144.584C139.792 155.819 143.207 167.473 145.33 179.334C150.26 151.791 162.156 125.37 181.346 102.704C196.538 84.7603 214.856 70.8766 234.973 61.1151Z" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M234.973 61.1151C233.33 44.7137 229.113 28.6476 222.583 13.4378C187.126 31.3053 158.585 61.2808 144.282 100.227C138.92 114.828 135.908 129.738 135.059 144.584C139.792 155.819 143.207 167.473 145.33 179.334C150.26 151.791 162.156 125.37 181.346 102.704C196.538 84.7603 214.856 70.8766 234.973 61.1151Z" />
            </svg>
          </span>
    
    
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

      </div>
      <md-outlined-button class="button-back" @click="${this.onBackButtonClicked}">${msg('Back')}</md-outlined-button>
      <md-filled-button class="button-next" @click="${this.onInstallButtonClicked}">Install</md-filled-button>
    </section>
    
    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'progress'}">
     <div class="c-progress container">
      <code class="c-progress bytes">
        write: ${this.megaBytesWritten}/${this.megaBytesTotal} MB ${this.writeSpeedMBps} MB/s <br>
        read: ${this.megaBytesRead}/${this.megaBytesTotal} MB ${this.readSpeedMBps} MB/s
      </code>
        <md-circular-progress class="c-progress" id="circular-progress" value=${this.circularProgressPercent} max=133> </md-circular-progress>
      </div>
      <div style="text-align: center"> ${msg('Extracting ISO.. Please wait')}</div>
    </section>  

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'bootloader'}">
      <div class="display-small" style="margin-left: 50px;">
        <li>${msg('Open /etc/grub.d/40_custom or /boot/grub/grub.cfg in a text editor')}</li><br>
        <div>${msg('Example:')}</div>
        <div class="codeblock-surface" > 
          <pre><code>  sudo nano /etc/grub.d/40_custom</code></pre>
        </div>
        <li>${msg('Create a new grub entry with the following code:')}</li><br>
        <div class="codeblock-surface">
          <div style="position: relative" title="Copy">
            <md-icon-button class="copy-button" @click="${this.copyCode}">
              <md-icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="-3 -4 30 30" role="presentation"><g fill="currentColor"><g><path d="M20 8h-9c-1.65 0-3 1.35-3 3v9c0 1.65 1.35 3 3 3h9c1.65 0 3-1.35 3-3v-9c0-1.65-1.35-3-3-3zm1 12c0 .55-.45 1-1 1h-9c-.55 0-1-.45-1-1v-9c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v9z"></path><path d="M5 14H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v1c0 .55.45 1 1 1s1-.45 1-1V4c0-1.65-1.35-3-3-3H4C2.35 1 1 2.35 1 4v9c0 1.65 1.35 3 3 3h1c.55 0 1-.45 1-1s-.45-1-1-1z"></path></g></g></svg>
              </md-icon>
            </md-icon-button>
          </div>
          <pre><code>${this.bootloaderMsg_}</code></pre>
        </div>
        <li>${msg('After editing /etc/grub.d/40_custom, re-generate grub config with command:')}</li><br>
        <div class="codeblock-surface" > 
        <pre><code>  sudo grub-mkconfig -o /boot/grub/grub.cfg</code></pre>
        </div>
        <p>${msg('The exact command to use may vary depending on your distro.')}</p>
        <pre>
          
        </pre>  
      </div>
      <md-filled-button class="button-next" @click="${this.onFinishButtonClicked}">${msg('Done')}</md-filled-button>
    </section>

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'bootloader-windows'}">
      <div class="display-small" style="margin-left: 50px;">
        <h4>${msg('Important')}</h4>
        <li>${msg('Only Bliss OS Grub can read from NTFS partitions.')}</li>
        <li>${msg('Compression should be disabled in drive properties for all files.')}</li>
        <li>${msg('Fastboot/hibernation should be disabled (See below).')}</li>
        <br>

        <details>
          <summary>${msg('Automatic installation')}</summary>
          <br>
          <md-filled-tonal-button @click="${this.onBootloaderButtonClicked}">
            <md-icon slot="icon">security</md-icon>
            ${msg(html`Click here to automatically perform the<br> below  actions using administrative rights`)}
          </md-filled-tonal-button>
          <br>
                    
          <h4>${msg('Step 1 - Open PowerShell')}</h4>
          <li>${msg('Press Win+X and select Windows Terminal (Admin) or Powershell')}</li>
          <li>${msg('Type below command and press enter key.')}</li>
          <div class="codeblock-surface" > 
            <pre><code>  powershell.exe</code></pre>
          </div>
          <li>${msg('Tip: Right click to paste text into the terminal.')}</li><br>
          <h4>${msg('Step 2 - Run the installer')}</h4>
          <div class="codeblock-surface" > 
            <pre><code>${this.bootloaderInstallProgram} install ${this.installDir}</code></pre>
          </div>
        </details>

        <details>
          <summary>${msg('Manual installation')}</summary>
                
          <h4>${msg('Step 1 - Open PowerShell')}</h4>
          <li>${msg('Press Win+X and select Windows Terminal (Admin) or Powershell')}</li>
          <li>${msg('Type below command and press enter key.')}</li>
          <div class="codeblock-surface" > 
            <pre><code>  powershell.exe</code></pre>
          </div>
          <li>${msg('Tip: Right click to paste text into the terminal.')}</li><br>
          <h4>${msg('Step 2 - Mount EFI System partition')}</h4>
            <div class="codeblock-surface" > 
              <pre><code>  mountvol X: /d</code></pre>
              <pre><code>  mountvol X: /s</code></pre>
            </div>
          <h4>${msg('Step 3 - Copy Android bootloader files')}</h4>
            <div class="codeblock-surface" > 
              <pre><code>  Copy-Item -Path ${this.installDir}\\boot -Destination X:\\ -Recurse -Force -Confirm</code></pre>
              <pre><code>  Copy-Item -Path ${this.installDir}\\efi\\boot -Destination X:\\EFI\\ -Recurse -Force -Confirm</code></pre>
            </div>

          <h4>${msg('Step 4 - Create bootloader entry for Android')}</h4>

          <div class="codeblock-surface" > 
            <div style="margin-left: 10px;">${msg('Windows 11:')}</div>
            <pre><code>  Copy-BcdEntry -Description "Android" -SourceEntryId bootmgr -TargetStore X:\\EFI\\Microsoft\\Boot\\BCD</code></pre>
          </div>
          <div class="codeblock-surface" > 
            <div style="margin-left: 10px;">${msg('Windows 10:')}</div>
            <pre><code>  bcdedit /copy '{bootmgr}' /d "Android"</code></pre>
          </div>

          <li>${msg('Use xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx from identifier {xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx} in output from previous command.')}</li>

          <div class="codeblock-surface" > 
            <div style="margin-left: 10px;">${msg('Windows 11:')}</div>
            <pre><code>  Set-BcdElement -Element path -Id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx -Type String -Value \\EFI\\boot\\BOOTx64.EFI</code></pre>
          </div>
          <div class="codeblock-surface" > 
            <div style="margin-left: 10px;">${msg('Windows 10:')}</div>
            <pre><code>  bcdedit /set '{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}' path \\EFI\\boot\\BOOTx64.EFI</code></pre>
          </div>

          <h4>${msg('Step 5 - Disable hibernation using PowerShell to avoid bootloop.')}</h4>
          <li>${msg('If turning off hibernation is undesirable, hold down shift key when shutting down Windows to perform a full shutdown, everytime before booting to Android.')}</li>
          <div class="codeblock-surface" > 
            <pre><code>  powercfg.exe /hibernate off</code></pre>
          </div>

          <div>${msg('Now you can boot to Android from UEFI Boot Menu in BIOS.')}</div>
          <p>${msg('Or press Ctrl+Alt+Del, click on power button and hold shift key while clicking on restart. After restarting, select "Use another device" or "Use another operating system" from the menu and select "Android".')}</p>
          <br>
        </details>
    
        <details>
          <summary>${msg('Uninstallation')}</summary>
          <h4>${msg('Manual install:')}</h4>
          <li>${msg('1. Run "bcdedit /enum firmware" to find {guid} and "bcdedit /delete \'{guid}\'"')}</li>
          <li>${msg('2. Mount EFI partition and delete the files listed in ')}${this.installDir}\\uninstall-bootloader.txt</li>
          <li>${msg('3. Delete ')}${this.installDir}</li>

          <h4>${msg('Automatic install:')}</h4>
          <li>${msg('Execute uninstall.bat file in the installation folder as administrator.')}</li>    
        </details>
      
        <pre>
          
        </pre>
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

    <md-dialog id="dialog" ?quick="${false}" ?no-focus-trap="${false}">
      <div slot="headline">
        ${this.dialogTitle_}
      </div>
      <form slot="content" id="form-id" method="dialog">
        ${this.dialogMsg_}  
      </form>
      <div slot="actions">
        <md-text-button form="form-id">OK</md-text-button>
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

  onBootloaderButtonClicked() {
    invoke("install_bootloader", { installDir: this.installDir, })
    .catch((error) => this.showDialog('Error', error))    
  }

  showDialog(dialogTitle, dialogMsg) {
    this.dialogTitle_ = dialogTitle;
    this.dialogMsg_ = html`${unsafeHTML(dialogMsg)}`;
    this.dialog.show();
  }

  async onFinishButtonClicked() {
    await exit(0);
  }

  updateProgress(progress) {
    this.circularProgressPercent = progress.progress_percent;
    
    this.megaBytesRead = progress.mb_read;
    this.readSpeedMBps = progress.read_speed_mbps;
    
    this.megaBytesWritten = progress.mb_written;
    this.writeSpeedMBps = progress.write_speed_mbps;
    
    this.megaBytesTotal = progress.mb_total;
  }

  async copyCode() {
    await navigator.clipboard.writeText(this.bootloaderMsg_);
    this.showDialog('Copied to clipboard', `<pre>${this.bootloaderMsg_}</pre>`);
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
    if (this.osType != 'windows')
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
    this.dataImg = this.renderRoot.querySelector('#c-data-img');
    this.dataDirSwitchEl = this.renderRoot.querySelector('#data-dir-switch'); 
    this.dataImgSwitchEl = this.renderRoot.querySelector('#data-img-switch'); 
    this.qemuInstallSwitchEl = this.renderRoot.querySelector('#qemu-install-switch'); 

    this.osType = type();
    if (this.osType == 'windows') {
      this.forceUseDataImg();
    }
  }  

  forceUseDataImg() {
    this.dataImgSwitchEl.selected = true;  
    this.dataDirSwitchEl.selected = false;  
    this.dataDirSwitchEl.disabled = true;
    this.dataImgSwitchState();
  }
}

customElements.define('installer-app', InstallerApp);
