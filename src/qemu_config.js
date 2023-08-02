import {css, LitElement, html} from 'lit';

export class QemuConfigElement extends LitElement {
  static styles = css`
      .container{
        display: none;
        position: absolute;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        inset: 0;
        block-size: 100dvh;
        inline-size: 100dvw;
        max-block-size: 100dvh;
        max-inline-size: 100dvw;
        border: none;
        background-color: var(--md-sys-color-background);
        color: var(--md-sys-color-on-background);
        padding: 0;
        margin: 0;
        overflow: clip;
      }
    `;

  static properties = {
    memMB: {type: Number},
  };

  constructor() {
    super();
  }

  firstUpdated() {
    
  }

  render() {
    return html`
        <section class="container">        
        </section>
      `;
  }
}
customElements.define('qemu-config', QemuConfigElement);