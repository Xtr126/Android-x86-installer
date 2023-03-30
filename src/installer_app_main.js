import {LitElement, css, html} from 'lit';

import '@material/web/button/tonal-button.js';
import '@material/web/iconbutton/standard-icon-button.js';
import '@material/web/textfield/filled-text-field'
import '@material/web/button/filled-button';
import '@material/web/button/outlined-button';

import androidLogo from './assets/android.svg'

export class InstallerApp extends LitElement {
  
  onFileButtonClicked() {
    this.dispatchEvent(new CustomEvent('pick-file'));
  }

  onBackButtonClicked() {
    this.dispatchEvent(new CustomEvent('back'));
  }

  onNextButtonClicked() {
    this.dispatchEvent(new CustomEvent('next'));
  }

  /** @override */
  static get properties() {
    return {
      activeCategory_: {type: String},
      fileName_: {type: String},
    };
  }

  constructor() {
    super();
    this.activeCategory_ = 'install'; 
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
              <slot></slot>
              <md-standard-icon-button @click="${this.onFileButtonClicked}" id="file-button" style="margin-left: -65px; position: fixed;"> folder_open </md-standard-icon-button>
              <md-tonal-button @click="${this.onNextButtonClicked}" label="Start" id="start-button" ></md-tonal-button>
            </div>
          </div>
    
        </div>
    </section>

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'details'}">
      <div class="row" style="justify-content: start;">
        <md-filled-text-field label="OS Title" style="margin-left: 60px;"></md-filled-text-field>
      </div>
      <md-outlined-button class="button-back" label="Back" @click="${this.onBackButtonClicked}"> </md-outlined-button>
      <md-filled-button class="button-next" label="Next" @click="${this.onNextButtonClicked}"> </md-filled-button>
    </section>

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'settings'}">
      <md-outlined-button class="button-back" label="Back" @click="${this.onBackButtonClicked}"> </md-outlined-button>
      <md-filled-button class="button-next" label="Next" @click="${this.onNextButtonClicked}"> </md-filled-button>
    </section>

    <section class="installer-app-category" ?active-category="${this.activeCategory_ === 'bootloader'}">
      <md-filled-button class="button-next" label="Done" @click="${this.onNextButtonClicked}"> </md-filled-button>
    </section>
    `;
  }

  /**
   * @param {!Event} e
   * @private
   */
  onCategoryChange_(e) {
    this.activeCategory_ = e.detail.category;
  }
}

customElements.define('installer-app', InstallerApp);
