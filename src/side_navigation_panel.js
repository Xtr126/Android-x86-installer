import {css, LitElement, html} from 'lit';

export class SideNavigationElement extends LitElement {

  /** @override */
  static styles = css`
      ::slotted(div) {
        border: 1px solid rgba(0, 0, 0, 0);
        border-radius: 0 16px 16px 0;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        line-height: 32px;
        margin: 8px 0;
        outline: none;
        padding: 0 24px 0 32px;
        user-select: none;
      }

      ::slotted(div:hover) {
        background-color: var(--md-sys-color-secondary-container);
      }

      ::slotted(div[active]) {
        background-color: var(--md-sys-color-surface-tint);
        color: var(--md-sys-color-primary-container);;
      }

      ::slotted(div:focus-visible) {
        border-color: rgb(26, 115, 232);
      }
    `;

  constructor() {
    super();

    /** @type {?Element} */
    this.activeElement_ = null;
  }

  /** @override */
  render() {
    return html`<slot></slot>`;
  }

  /** @override */
  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    
    if (this.firstElementChild) {
      this.activate_(this.firstElementChild);
    }
  }

  /** @param {!Element} element */
  activate_(element) {
    if (this.activeElement_) {
      this.activeElement_.removeAttribute('active');
    }
    this.activeElement_ = element;
    element.setAttribute('active', '');
    this.dispatchEvent(new CustomEvent('category-change', {
      detail: {
        category: element.getAttribute('data-name'),
      },
    }));
  }

  activateNextCategory() {
    let element = null;
    for (const option of this.children) {
      if (element != null)
      if (element.getAttribute('active') != null) {
        this.activate_(option);
        return;
      }
      element = option;
    }
  }

  activatePreviousCategory() {
    let element = null;
    for (const option of this.children) {
      if (option.getAttribute('active') != null) {
        this.activate_(element);
        return;
      }
      element = option;
    }
  }
}

customElements.define('side-navigation-panel',
    SideNavigationElement);
