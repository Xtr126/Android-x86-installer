import {LitElement, css, html} from 'lit';

import '@material/web/button/tonal-button.js';
import '@material/web/iconbutton/standard-icon-button.js';
import '@material/web/button/filled-button';
import '@material/web/button/outlined-button';
import '@material/web/button/text-button';
import '@material/web/dialog/dialog';
import '@material/web/circularprogress/circular-progress';
import '@material/web/elevation/elevation'
import { exit } from '@tauri-apps/api/process';

import androidLogo from './assets/android.svg'

export class InstallerApp extends LitElement {

  /** @override */
  static get properties() {
    return {
      activeCategory_: {type: String},
      dialogTitle_: {type: String},
      dialogMsg_: {type: String},
      progressPercent_: {type: Number},
      bootloaderMsg_: {type: String},
    };
  }

  constructor() {
    super();
    this.activeCategory_ = 'install';
    this.progressPercent_ = 0;
    this.bootloaderMsg_ = 
`  menuentry "Android" --class android-x86 {
    savedefault
    search --no-floppy --set=root --file /boot/grub/grub.cfg
    configfile /boot/grub/grub.cfg
  }`;
  }

  /** @override */
  static get styles() {
    return css`
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
      position: absolute;
      bottom: 0;
      margin-left: 50px;
      margin-bottom: 20px;
    }

    .button-next {
      position: absolute;
      bottom: 0;
      right: 0;
      margin-right: 20px;
      margin-bottom: 20px;
    }

    .c-progress {
      margin: auto;
      --md-circular-progress-size: 40vh;
      --md-circular-progress-active-indicator-width: 4.33;
    }

    .c-progress.container {
      height: 80vh;
      width: 60vh;
    }

    .codeblock-surface {
      background-color: var( --md-sys-color-surface-container-high);
      border-radius: 1em;
      border-width: 1px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      width: 100%;
      --md-elevation-level: 5;
    }

    .copy-button {
      display: flex;
      border-radius: 9999px;
      background-color: rgb(34 34 34);
      color: rgb(158 158 158);
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
    `  
  }

  /** @override */
  render() {
    return html`
    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'install'}">
      
        <div class="container on-background-text">
          <h1>Install Android on your PC</h1>
    
          <div class="row">
            <a target="_blank">
              <img src=${androidLogo} class="logo android" alt="Android logo" />
            </a>
          </div>
    
          <p class="label-large" style="margin-bottom: 15px;">Select your Android x86 Installation media or .ISO file to continue</p>
    
          <div class="row label">
            <div>
              <slot name="file_name"></slot>
              <md-standard-icon-button @click="${this.onFileButtonClicked}" style="margin-left: -62px; margin-top: 3px; position: fixed;"> folder_open </md-standard-icon-button>
              <md-tonal-button @click="${this.onNextButtonClicked}" id="start-button" >Start</md-tonal-button>
            </div>
          </div>
    
        </div>
    </section>

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'settings'}">
      <div class="column" style="justify-content: start;">
        <slot name="os_title"></slot>
        <div>
          <slot name="install_dir"></slot>
          <md-standard-icon-button @click="${this.onFolderButtonClicked}"> folder_open </md-standard-icon-button>
        </div>
      </div>
      <md-outlined-button class="button-back" @click="${this.onBackButtonClicked}">Back</md-outlined-button>
      <md-filled-button class="button-next" @click="${this.onInstallButtonClicked}">Install</md-filled-button>
    </section>
    
    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'progress'}">
      <div class="container c-progress">
        <md-circular-progress class="c-progress" id="circular-progress"> </md-circular-progress>
        <p style="margin: auto;"> Extracting ISO ${this.progressPercent_}% </p>
      </div>
    </section>  

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'bootloader'}">
      <div class="display-small" style="margin-left: 50px;">
        <p> Open /etc/grub.d/40_custom or /boot/grub/grub.cfg in a text editor </p>
        <p> Create a new grub entry with the following code: </p>
        <div class="codeblock-surface">
        <md-elevation></md-elevation>
        <div style="position: relative" title="Copy">
        <md-standard-icon-button class="copy-button" @click="${this.copyCode}"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="-3 -4 30 30" role="presentation"><g fill="currentColor"><g><path d="M20 8h-9c-1.65 0-3 1.35-3 3v9c0 1.65 1.35 3 3 3h9c1.65 0 3-1.35 3-3v-9c0-1.65-1.35-3-3-3zm1 12c0 .55-.45 1-1 1h-9c-.55 0-1-.45-1-1v-9c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v9z"></path><path d="M5 14H4c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v1c0 .55.45 1 1 1s1-.45 1-1V4c0-1.65-1.35-3-3-3H4C2.35 1 1 2.35 1 4v9c0 1.65 1.35 3 3 3h1c.55 0 1-.45 1-1s-.45-1-1-1z"></path></g></g></svg></md-standard-icon-button>
        </div>
        <pre><code>${this.bootloaderMsg_}</code></pre>
        </div>
        <p> If it is desired to edit /etc/grub.d/40_custom then 
          re-generate grub config after saving file to apply changes </p>
      </div>
      <md-filled-button class="button-next" @click="${this.onFinishButtonClicked}">Done</md-filled-button>
    </section>

    <md-dialog id="dialog">
      <span slot="header">${this.dialogTitle_}</span>
      <div>
        ${this.dialogMsg_}  
      </div>
      <md-text-button @click="${this.closeDialog}" slot="footer">OK</md-text-button>
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
    this.dispatchEvent(new CustomEvent('install'));
  }

  showDialog(dialogTitle, dialogMsg) {
    this.dialogTitle_ = dialogTitle;
    this.dialogMsg_ = dialogMsg;
    this.dialog.show();
  }

  async onFinishButtonClicked() {
    await exit(1);
  }

  closeDialog() {
    this.dialog.close();
  }

  updateProgress(progress) {
    this.progressPercent_ = progress;
    this.circularProgress.progress = progress / 100;
  }

  async copyCode() {
    await navigator.clipboard.writeText(this.bootloaderMsg_);
    this.showDialog('Copied to clipboard', this.bootloaderMsg_);
  }
  
  firstUpdated() {
    this.dialog = this.renderRoot.querySelector('#dialog');
    this.circularProgress = this.renderRoot.querySelector('#circular-progress');
  }  
}

customElements.define('installer-app', InstallerApp);
