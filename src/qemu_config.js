import {css, LitElement, html} from 'lit';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';

export class QemuConfigElement extends LitElement {
  static styles = css`
      .setting-container {
        align-items: center;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        display: flex;
        flex-wrap: nowrap;
        margin: 0 32px 0 32px;
        padding: 0;
      }

      .setting-container.textfield {
        margin: 12px 0px 12px 32px;
      }

      h4 {
        color: var(--md-sys-color-on-background);
        font-weight: 400;
        line-height: 24px;
        margin: 12px 12px;
        flex-grow: 1;
      }

      md-switch {
        margin: 12px;
      }
    `;

  static properties = {
    memMB: {type: Number},
    cores: {type: Number},
  };

  constructor() {
    super();
    this.cores = 2;
    this.memMB = 2096;
  }

  firstUpdated() {
    const menuListeners = this.renderRoot.querySelectorAll('[data-menu]');
    menuListeners.forEach((el) => {
      const menuId = el.dataset.menu;
      el.addEventListener('click', () => {
        const menu = this.renderRoot.querySelector(`#${menuId}`);
        menu.anchor = this.renderRoot.querySelector('#console');
        menu.show();
      });
    });
    this.consoleSwitch = this.renderRoot.querySelector('#console');
    this.e2fsckSwitch = this.renderRoot.querySelector('#e2fsck');
    this.displayTypeSelect = this.renderRoot.querySelector('#display_type'); 
    this.useGlSelect = this.renderRoot.querySelector('#use_gl'); 
    this.deviceTypeSelect = this.renderRoot.querySelector('#device_type'); 
    this.pointerDeviceSelect = this.renderRoot.querySelector('#pointer_device'); 
    this.fwdPortSwitch = this.renderRoot.querySelector('#fwd_port');
    this.fwdPortTextField = this.renderRoot.querySelector('#fwd_port_no');
    this.sdlSwitch = this.renderRoot.querySelector('#sdl_videodriver_override');
    this.sdlSelect = this.renderRoot.querySelector('#sdl_videodriver');
    this.xresTextField = this.renderRoot.querySelector('#xres');
    this.yresTextField = this.renderRoot.querySelector('#yres');

    this.fwdPortTextField.value = 5555;
    this.xresTextField.value = 1280;
    this.yresTextField.value = 720;
  }

  onCloseMemMenu(event){
    this.memMB = event.initiator.id;
  }


  onCloseCpuMenu(event){
    this.cores = event.initiator.headline;
  }

  invokeInstall(installEl, _installDir){
    invoke("create_data_img", {  
      installDir: _installDir,
      memsizeMb: this.memMB,
      cpus: this.cores,
      xRes: this.xresTextField.value,
      yRes: this.yresTextField.value,

      displayType: this.displayTypeSelect.value,
      useGl: this.useGlSelect.value,

      deviceType: this.deviceTypeSelect.value,
      inputType: this.pointerDeviceSelect.value,

      enableSerialConsole: this.consoleSwitch.selected,
      performE2fsck: this.e2fsckSwitch.selected,

      forwardPort: this.fwdPortSwitch.selected,
      forwardPortNo: this.fwdPortTextField.value,

      overrideSdlVideodriver: this.sdlSwitch.selected,
      sdlVideodriver: this.sdlSelect.value,
    }).then((res) => installEl.showDialog('Create data.img success', res))
    .catch((error) => installEl.showDialog('Create data.img failed', error))
  }

  render() {
    return html`

          
<li class="setting-container">
            <div style="position:relative;">
          <md-menu id="cores" @close-menu=${this.onCloseCpuMenu}>
    <md-menu-item headline="1"></md-menu-item>
    <md-menu-item headline="2"></md-menu-item>
    <md-menu-item headline="4"></md-menu-item>
  </md-menu>

</div>
<div style="position:relative; ">
  <md-menu id="mem" @close-menu=${this.onCloseMemMenu}>
    <md-menu-item id="2096" headline="2 GB"></md-menu-item>
    <md-menu-item id="3072" headline="3 GB"></md-menu-item>
    <md-menu-item id="4096" headline="4 GB"></md-menu-item>
  </md-menu></div>
          <md-icon>memory</md-icon>
          <h4 style="flex-grow: 0;">CPU: ${this.cores}-core</h4>
          <md-standard-icon-button data-menu="cores"><md-icon>expand_more</md-icon></md-standard-icon-button>
          <div style="flex-grow: 0.5; display: flex;"></div>
          <md-icon>memory_alt</md-icon>
          <h4 style="flex-grow: 0;">Memory: ${this.memMB} MB</h4>
          <md-standard-icon-button data-menu="mem"><md-icon>expand_more</md-icon></md-standard-icon-button>
        </li>

         <li class="setting-container" >
        <md-icon>terminal</md-icon>
              <h4 id="anchor">Enable serial console</h4>
              <md-switch id="console"></md-switch>
        </li>    

        <li class="setting-container">
        <md-icon>build</md-icon>
              <h4>Run e2fsck -fy android.img</h4>
              <md-switch id="e2fsck"></md-switch>
        </li>

          <li class="setting-container textfield">
          <md-outlined-text-field id="xres" label="Xres"></md-outlined-text-field>
          <md-outlined-text-field id="yres" label="Yres"></md-outlined-text-field>
          <div style="flex-grow: 1; display: flex; width:100px"></div></li>

        <li class="setting-container textfield">
        <md-outlined-select id="display_type" label="Display type">
    <md-select-option value="sdl" headline="SDL"></md-select-option>
    <md-select-option selected value="gtk" headline="GTK"></md-select-option>
  </md-outlined-select>
  <md-outlined-select id="use_gl" label="Use OpenGL">
    <md-select-option selected value="on" headline="OpenGL"></md-select-option>
    <md-select-option value="es" headline="OpenGL ES"></md-select-option>
  </md-outlined-select></li>

        <li class="setting-container textfield">
        <md-outlined-select id="device_type" label="Device type">
    <md-select-option value="virtio" headline="VirtIO"></md-select-option>
    <md-select-option selected value="usb" headline="USB"></md-select-option>
  </md-outlined-select>
  <md-outlined-select id="pointer_device" label="Pointer device">
    <md-select-option value="tablet" headline="Tablet"></md-select-option>
    <md-select-option selected value="mouse" headline="Mouse"></md-select-option>
  </md-outlined-select></li>

  <li class="setting-container textfield">
      <md-outlined-text-field id="fwd_port_no" label="Forward port:"></md-outlined-text-field>
      <md-switch id="fwd_port"></md-switch>
      <div style="flex-grow: 1; display: flex; width: 50px"></div>
      <md-outlined-select id="sdl_videodriver" label="Override SDL_VIDEODRIVER">
    <md-select-option headline="x11"></md-select-option>
    <md-select-option selected headline="wayland"></md-select-option>
  </md-outlined-select>
  <md-switch id="sdl_videodriver_override"></md-switch>

        </li>
       
      `;
  }
}
customElements.define('qemu-config', QemuConfigElement);