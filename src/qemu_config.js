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
  el.addEventListener('click', (evt) => {
    const menu = this.renderRoot.querySelector(`#${menuId}`);
    menu.anchor = this.renderRoot.querySelector('#anchor');
    menu.show();
  });
});
  }

  render() {
    return html`

          
<li class="setting-container">
            <div style="position:relative;">
          <md-menu id="cores">
    <md-menu-item headline="1"></md-menu-item>
    <md-menu-item headline="2"></md-menu-item>
    <md-menu-item headline="4"></md-menu-item>
  </md-menu>

</div>
<div style="position:relative; ">
  <md-menu id="mem">
    <md-menu-item headline="2 GB"></md-menu-item>
    <md-menu-item headline="3 GB"></md-menu-item>
    <md-menu-item headline="4 GB"></md-menu-item>
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
              <md-switch ></md-switch>
        </li>    

        <li class="setting-container">
        <md-icon>build</md-icon>
              <h4>Run e2fsck -fy android.img</h4>
              <md-switch></md-switch>
        </li>

          <li class="setting-container textfield">
          <md-outlined-text-field label="Xres" value="1280"></md-outlined-text-field>
          <md-outlined-text-field label="Yres" value="720"></md-outlined-text-field>
          <div style="flex-grow: 1; display: flex; width:100px"></div></li>

        <li class="setting-container textfield">
        <md-outlined-select label="Display type">
    <md-select-option value="sdl" headline="SDL"></md-select-option>
    <md-select-option selected value="gtk" headline="GTK"></md-select-option>
  </md-outlined-select>
  <md-outlined-select label="Use OpenGL">
    <md-select-option selected value="on" headline="OpenGL"></md-select-option>
    <md-select-option value="es" headline="OpenGL ES"></md-select-option>
  </md-outlined-select></li>

        <li class="setting-container textfield">
        <md-outlined-select label="Device type">
    <md-select-option value="virtio" headline="VirtIO"></md-select-option>
    <md-select-option selected value="usb" headline="USB"></md-select-option>
  </md-outlined-select>
  <md-outlined-select label="Pointer device">
    <md-select-option value="tablet" headline="Tablet"></md-select-option>
    <md-select-option selected value="mouse" headline="Mouse"></md-select-option>
  </md-outlined-select></li>

  <li class="setting-container textfield">
      <md-outlined-text-field label="Forward port:" value="5555"></md-outlined-text-field>
      <md-switch></md-switch>
      <div style="flex-grow: 1; display: flex; width: 50px"></div>
      <md-outlined-select label="Override SDL_VIDEODRIVER">
    <md-select-option headline="x11"></md-select-option>
    <md-select-option selected headline="wayland"></md-select-option>
  </md-outlined-select>
  <md-switch></md-switch>

        </li>
       
      `;
  }
}
customElements.define('qemu-config', QemuConfigElement);