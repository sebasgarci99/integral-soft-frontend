import {
  Tooltip,
  TooltipModule
} from "./chunk-ZWBNV3XB.js";
import "./chunk-NMOYQVAO.js";
import {
  Badge,
  BadgeModule
} from "./chunk-LEQG3TVO.js";
import {
  Ripple
} from "./chunk-YZ4CXD4A.js";
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from "./chunk-V6PZLO3Y.js";
import "./chunk-5G7WYC4N.js";
import {
  BaseComponent
} from "./chunk-HOW5VWZN.js";
import "./chunk-ORPSEVGH.js";
import {
  BaseStyle
} from "./chunk-6TA5B4NM.js";
import {
  PrimeTemplate,
  SharedModule,
  findSingle,
  focus,
  getAttribute,
  getOffset,
  getWidth,
  resolve
} from "./chunk-SN7RFI2O.js";
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule
} from "./chunk-LAQZIOYQ.js";
import "./chunk-EDFWISRF.js";
import "./chunk-TTPXWPGZ.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet
} from "./chunk-OL7WVFLG.js";
import "./chunk-JVBOKW6K.js";
import {
  isPlatformBrowser
} from "./chunk-P3LJCSKC.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  Injectable,
  Input,
  NgModule,
  Output,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  setClassMetadata,
  signal,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵgetInheritedFactory,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵsanitizeHtml,
  ɵɵsanitizeUrl,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵviewQuery
} from "./chunk-D7Y4CFTW.js";
import "./chunk-P6U2JBMQ.js";
import "./chunk-WDMUDEB6.js";

// node_modules/primeng/fesm2022/primeng-tabmenu.mjs
var _c0 = ["item"];
var _c1 = ["previousicon"];
var _c2 = ["nexticon"];
var _c3 = ["content"];
var _c4 = ["navbar"];
var _c5 = ["inkbar"];
var _c6 = ["prevBtn"];
var _c7 = ["nextBtn"];
var _c8 = ["tabLink"];
var _c9 = ["tab"];
var _c10 = (a0) => ({
  "p-tabmenu p-component": true,
  "p-tabmenu-scrollable": a0
});
var _c11 = (a0, a1, a2) => ({
  "p-tabmenuitem": true,
  "p-disabled": a0,
  "p-tabmenuitem-active": a1,
  "p-hidden": a2
});
var _c12 = (a0, a1) => ({
  $implicit: a0,
  index: a1
});
var _c13 = () => ({
  exact: false
});
function TabMenu_button_2_ChevronLeftIcon_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ChevronLeftIcon");
  }
  if (rf & 2) {
    ɵɵattribute("aria-hidden", true);
  }
}
function TabMenu_button_2_3_ng_template_0_Template(rf, ctx) {
}
function TabMenu_button_2_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabMenu_button_2_3_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function TabMenu_button_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 17, 3);
    ɵɵlistener("click", function TabMenu_button_2_Template_button_click_0_listener() {
      ɵɵrestoreView(_r2);
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.navBackward());
    });
    ɵɵtemplate(2, TabMenu_button_2_ChevronLeftIcon_2_Template, 1, 1, "ChevronLeftIcon", 18)(3, TabMenu_button_2_3_Template, 1, 0, null, 19);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance(2);
    ɵɵproperty("ngIf", !ctx_r2.previousIconTemplate && !ctx_r2._previousIconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r2.previousIconTemplate || ctx_r2._previousIconTemplate);
  }
}
function TabMenu_li_7_a_2_span_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 28);
  }
  if (rf & 2) {
    const item_r5 = ɵɵnextContext(2).$implicit;
    ɵɵproperty("ngClass", item_r5.icon)("ngStyle", item_r5.iconStyle);
  }
}
function TabMenu_li_7_a_2_span_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 29);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r5 = ɵɵnextContext(2).$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r2.getItemProp(item_r5, "label"));
  }
}
function TabMenu_li_7_a_2_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 30);
  }
  if (rf & 2) {
    const item_r5 = ɵɵnextContext(2).$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵproperty("innerHTML", ctx_r2.getItemProp(item_r5, "label"), ɵɵsanitizeHtml);
  }
}
function TabMenu_li_7_a_2_p_badge_7_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "p-badge", 31);
  }
  if (rf & 2) {
    const item_r5 = ɵɵnextContext(2).$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵproperty("styleClass", item_r5.badgeStyleClass)("value", ctx_r2.getItemProp(item_r5, "badge"));
  }
}
function TabMenu_li_7_a_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "a", 24, 5);
    ɵɵelementContainerStart(2);
    ɵɵtemplate(3, TabMenu_li_7_a_2_span_3_Template, 1, 2, "span", 25)(4, TabMenu_li_7_a_2_span_4_Template, 2, 1, "span", 26)(5, TabMenu_li_7_a_2_ng_template_5_Template, 1, 1, "ng-template", null, 6, ɵɵtemplateRefExtractor)(7, TabMenu_li_7_a_2_p_badge_7_Template, 1, 2, "p-badge", 27);
    ɵɵelementContainerEnd();
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const htmlLabel_r8 = ɵɵreference(6);
    const item_r5 = ɵɵnextContext().$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵproperty("target", ctx_r2.getItemProp(item_r5, "target"))("tabindex", -1);
    ɵɵattribute("href", ctx_r2.getItemProp(item_r5, "url"), ɵɵsanitizeUrl)("id", ctx_r2.getItemProp(item_r5, "id"))("aria-disabled", ctx_r2.disabled(item_r5));
    ɵɵadvance(3);
    ɵɵproperty("ngIf", item_r5.icon);
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r5.escape !== false)("ngIfElse", htmlLabel_r8);
    ɵɵadvance(3);
    ɵɵproperty("ngIf", item_r5.badge);
  }
}
function TabMenu_li_7_a_3_span_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 28);
  }
  if (rf & 2) {
    const item_r5 = ɵɵnextContext(2).$implicit;
    ɵɵproperty("ngClass", item_r5.icon)("ngStyle", item_r5.iconStyle);
    ɵɵattribute("aria-hidden", true);
  }
}
function TabMenu_li_7_a_3_span_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 29);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r5 = ɵɵnextContext(2).$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r2.getItemProp(item_r5, "label"));
  }
}
function TabMenu_li_7_a_3_ng_template_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 30);
  }
  if (rf & 2) {
    const item_r5 = ɵɵnextContext(2).$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵproperty("innerHTML", ctx_r2.getItemProp(item_r5, "label"), ɵɵsanitizeHtml);
  }
}
function TabMenu_li_7_a_3_p_badge_7_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "p-badge", 31);
  }
  if (rf & 2) {
    const item_r5 = ɵɵnextContext(2).$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵproperty("styleClass", item_r5.badgeStyleClass)("value", ctx_r2.getItemProp(item_r5, "badge"));
  }
}
function TabMenu_li_7_a_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "a", 32, 5);
    ɵɵelementContainerStart(2);
    ɵɵtemplate(3, TabMenu_li_7_a_3_span_3_Template, 1, 3, "span", 25)(4, TabMenu_li_7_a_3_span_4_Template, 2, 1, "span", 26)(5, TabMenu_li_7_a_3_ng_template_5_Template, 1, 1, "ng-template", null, 7, ɵɵtemplateRefExtractor)(7, TabMenu_li_7_a_3_p_badge_7_Template, 1, 2, "p-badge", 27);
    ɵɵelementContainerEnd();
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const htmlRouteLabel_r9 = ɵɵreference(6);
    const item_r5 = ɵɵnextContext().$implicit;
    const ctx_r2 = ɵɵnextContext();
    ɵɵproperty("routerLink", item_r5.routerLink)("queryParams", item_r5.queryParams)("routerLinkActive", "p-menuitem-link-active")("routerLinkActiveOptions", item_r5.routerLinkActiveOptions || ɵɵpureFunction0(18, _c13))("target", item_r5.target)("tabindex", -1)("fragment", item_r5.fragment)("queryParamsHandling", item_r5.queryParamsHandling)("preserveFragment", item_r5.preserveFragment)("skipLocationChange", item_r5.skipLocationChange)("replaceUrl", item_r5.replaceUrl)("state", item_r5.state);
    ɵɵattribute("id", ctx_r2.getItemProp(item_r5, "id"))("aria-disabled", ctx_r2.disabled(item_r5));
    ɵɵadvance(3);
    ɵɵproperty("ngIf", item_r5.icon);
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r5.escape !== false)("ngIfElse", htmlRouteLabel_r9);
    ɵɵadvance(3);
    ɵɵproperty("ngIf", item_r5.badge);
  }
}
function TabMenu_li_7_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function TabMenu_li_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "li", 20, 4);
    ɵɵlistener("click", function TabMenu_li_7_Template_li_click_0_listener($event) {
      const item_r5 = ɵɵrestoreView(_r4).$implicit;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.itemClick($event, item_r5));
    })("keydown", function TabMenu_li_7_Template_li_keydown_0_listener($event) {
      const ctx_r5 = ɵɵrestoreView(_r4);
      const item_r5 = ctx_r5.$implicit;
      const i_r7 = ctx_r5.index;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onKeydownItem($event, i_r7, item_r5));
    })("focus", function TabMenu_li_7_Template_li_focus_0_listener() {
      const item_r5 = ɵɵrestoreView(_r4).$implicit;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onMenuItemFocus(item_r5));
    });
    ɵɵtemplate(2, TabMenu_li_7_a_2_Template, 8, 9, "a", 21)(3, TabMenu_li_7_a_3_Template, 8, 19, "a", 22)(4, TabMenu_li_7_ng_container_4_Template, 1, 0, "ng-container", 23);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r5 = ctx.$implicit;
    const i_r7 = ctx.index;
    const ctx_r2 = ɵɵnextContext();
    ɵɵclassMap(item_r5.styleClass);
    ɵɵproperty("ngStyle", item_r5.style)("ngClass", ɵɵpureFunction3(13, _c11, ctx_r2.getItemProp(item_r5, "disabled"), ctx_r2.isActive(item_r5), item_r5.visible === false))("tooltipOptions", item_r5.tooltipOptions);
    ɵɵattribute("data-p-disabled", ctx_r2.disabled(item_r5))("data-p-highlight", ctx_r2.focusedItemInfo() === item_r5)("aria-label", ctx_r2.getItemProp(item_r5, "label"))("tabindex", ctx_r2.disabled(item_r5) ? -1 : 0);
    ɵɵadvance(2);
    ɵɵproperty("ngIf", !item_r5.routerLink && !ctx_r2.itemTemplate && !ctx_r2._itemTemplate);
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r5.routerLink && !ctx_r2.itemTemplate && !ctx_r2._itemTemplate);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r2.itemTemplate)("ngTemplateOutletContext", ɵɵpureFunction2(17, _c12, item_r5, i_r7));
  }
}
function TabMenu_button_10_ChevronRightIcon_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ChevronRightIcon");
  }
  if (rf & 2) {
    ɵɵattribute("aria-hidden", true);
  }
}
function TabMenu_button_10_3_ng_template_0_Template(rf, ctx) {
}
function TabMenu_button_10_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, TabMenu_button_10_3_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function TabMenu_button_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 33, 8);
    ɵɵlistener("click", function TabMenu_button_10_Template_button_click_0_listener() {
      ɵɵrestoreView(_r10);
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.navForward());
    });
    ɵɵtemplate(2, TabMenu_button_10_ChevronRightIcon_2_Template, 1, 1, "ChevronRightIcon", 18)(3, TabMenu_button_10_3_Template, 1, 0, null, 19);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext();
    ɵɵadvance(2);
    ɵɵproperty("ngIf", !ctx_r2.previousIconTemplate && !ctx_r2._previousIconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r2.nextIconTemplate || ctx_r2._nextIconTemplate);
  }
}
var theme = ({
  dt
}) => `

/* For PrimeNG */
.p-tabmenu.p-component {
    display: flex;
    flex-direction: column;
}

.p-tabmenu-nav-container {
    display: flex;
    position: relative;
}

.p-tabmenu.p-tabmenu-scrollable .p-tabmenu-nav-container {
    overflow: hidden;
}

.p-tabmenu-nav-content {
    flex-grow: 1;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
    overscroll-behavior: contain auto;
}

.p-tabmenu-nav {
    padding: 0;
    margin: 0;
    list-style-type: none;
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    background: ${dt("tabs.tablist.background")};
    border-style: solid;
    border-color: ${dt("tabs.tablist.border.color")};
    border-width: ${dt("tabs.tablist.border.width")};
}

.p-tabmenuitem {
    display: flex;
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
    border-style: solid;
    background: ${dt("tabs.tab.background")};
    border-width: ${dt("tabs.tab.border.width")};
    border-color: ${dt("tabs.tab.border.color")};
    padding: ${dt("tabs.tab.padding")};
    transition: background ${dt("tabs.transition.duration")}, border-color ${dt("tabs.transition.duration")}, color ${dt("tabs.transition.duration")}, outline-color ${dt("tabs.transition.duration")}, box-shadow ${dt("tabs.transition.duration")};
    margin: ${dt("tabs.tab.margin")};
    outline-color: transparent;
}

.p-tabmenuitem > .p-menuitem-link {
    white-space: nowrap;
    user-select: none;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    overflow: hidden;
    position: relative;
    gap: ${dt("tabs.tab.gap")};
    color: ${dt("tabs.tab.color")};
    font-weight: ${dt("tabs.tab.font.weight")};
}

.p-tabmenuitem.p-tabmenuitem-active .p-menuitem-link {
    color: ${dt("tabs.tab.active.color")};
}

.p-tabmenuitem:not(.p-disabled):focus-visible {
    z-index: 1;
    box-shadow: ${dt("tabs.tab.focus.ring.shadow")};
    outline: ${dt("tabs.tab.focus.ring.width")} ${dt("tabs.tab.focus.ring.style")} ${dt("tabs.tab.focus.ring.color")};
    outline-offset: ${dt("tabs.tab.focus.ring.offset")};
}

.p-tabmenuitem:not(.p-tabmenuitem-active):not(.p-disabled):hover {
    background: ${dt("tabs.tab.hover.background")};
    border-color: ${dt("tabs.tab.hover.border.color")};
    color: ${dt("tabs.tab.hover.color")};
}

.p-tabmenuitem-active {
    background: ${dt("tabs.tab.active.background")};
    border-color: ${dt("tabs.tab.active.border.color")};
    color: ${dt("tabs.tab.active.color")};
}

.p-tabmenuitem-active-bar {
    z-index: 1;
    display: block;
    position: absolute;
    bottom: ${dt("tabs.active.bar.bottom")};
    height: ${dt("tabs.active.bar.height")};
    background: ${dt("tabs.active.bar.background")};
    transition: 250ms cubic-bezier(0.35, 0, 0.25, 1);
}

.p-tabmenu-nav-button {
    all: unset;
    position: absolute !important;
    flex-shrink: 0;
    top: 0;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${dt("tabs.nav.button.background")};
    color: ${dt("tabs.nav.button.color")};
    width: ${dt("tabs.nav.button.width")};
    transition: color ${dt("tabs.transition.duration")}, outline-color ${dt("tabs.transition.duration")}, box-shadow ${dt("tabs.transition.duration")};
    box-shadow: ${dt("tabs.nav.button.shadow")};
    outline-color: transparent;
    cursor: pointer;
}

.p-tabmenu-nav-button:focus-visible {
    z-index: 1;
    box-shadow: ${dt("tabs.nav.button.focus.ring.shadow")};
    outline: ${dt("tabs.nav.button.focus.ring.width")} ${dt("tabs.nav.button.focus.ring.style")} ${dt("tabs.nav.button.focus.ring.color")};
    outline-offset: ${dt("tabs.nav.button.focus.ring.offset")};
}

.p-tabmenu-nav-button:hover {
    color: ${dt("tabs.nav.button.hover.color")};
}

.p-tabmenu-nav-prev-button {
    left: 0;
}

.p-tabmenu-nav-next-button {
    right: 0;
}`;
var TabMenuStyle = class _TabMenuStyle extends BaseStyle {
  name = "tabs";
  theme = theme;
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵTabMenuStyle_BaseFactory;
    return function TabMenuStyle_Factory(__ngFactoryType__) {
      return (ɵTabMenuStyle_BaseFactory || (ɵTabMenuStyle_BaseFactory = ɵɵgetInheritedFactory(_TabMenuStyle)))(__ngFactoryType__ || _TabMenuStyle);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _TabMenuStyle,
    factory: _TabMenuStyle.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TabMenuStyle, [{
    type: Injectable
  }], null, null);
})();
var TabMenuClasses;
(function(TabMenuClasses2) {
  TabMenuClasses2["root"] = "p-tabmenu";
  TabMenuClasses2["tablist"] = "p-tabmenu-tablist";
  TabMenuClasses2["item"] = "p-tabmenu-item";
  TabMenuClasses2["itemLink"] = "p-tabmenu-item-link";
  TabMenuClasses2["itemIcon"] = "p-tabmenu-item-icon";
  TabMenuClasses2["itemLabel"] = "p-tabmenu-item-label";
  TabMenuClasses2["inkbar"] = "p-tabmenu-ink-bar";
})(TabMenuClasses || (TabMenuClasses = {}));
var TabMenu = class _TabMenu extends BaseComponent {
  /**
   * An array of menuitems.
   * @group Props
   */
  set model(value) {
    this._model = value;
    this._focusableItems = (this._model || []).reduce((result, item) => {
      result.push(item);
      return result;
    }, []);
  }
  get model() {
    return this._model;
  }
  /**
   * Defines the default active menuitem
   * @group Props
   */
  set activeItem(value) {
    this._activeItem = value;
    this.activeItemChange.emit(value);
    this.tabChanged = true;
  }
  get activeItem() {
    return this._activeItem;
  }
  /**
   * When enabled displays buttons at each side of the tab headers to scroll the tab list.
   * @group Props
   */
  scrollable;
  /**
   * Defines if popup mode enabled.
   */
  popup;
  /**
   * Inline style of the element.
   * @group Props
   */
  style;
  /**
   * Class of the element.
   * @group Props
   */
  styleClass;
  /**
   * Defines a string value that labels an interactive element.
   * @group Props
   */
  ariaLabel;
  /**
   * Identifier of the underlying input element.
   * @group Props
   */
  ariaLabelledBy;
  /**
   * Event fired when a tab is selected.
   * @param {MenuItem} item - Menu item.
   * @group Emits
   */
  activeItemChange = new EventEmitter();
  content;
  navbar;
  inkbar;
  prevBtn;
  nextBtn;
  tabLink;
  tab;
  /**
   * Template of the menu item.
   * @group Templates
   */
  itemTemplate;
  /**
   * Template of the previous icon.
   * @group Templates
   */
  previousIconTemplate;
  /**
   * Template of the next icon.
   * @group Templates
   */
  nextIconTemplate;
  templates;
  _itemTemplate;
  _nextIconTemplate;
  _previousIconTemplate;
  tabChanged;
  backwardIsDisabled = true;
  forwardIsDisabled = false;
  timerIdForInitialAutoScroll = null;
  _focusableItems;
  _model;
  _activeItem;
  focusedItemInfo = signal(null);
  router = inject(Router);
  route = inject(ActivatedRoute);
  _componentStyle = inject(TabMenuStyle);
  get focusableItems() {
    if (!this._focusableItems || !this._focusableItems.length) {
      this._focusableItems = (this.model || []).reduce((result, item) => {
        result.push(item);
        return result;
      }, []);
    }
    return this._focusableItems;
  }
  constructor() {
    super();
    console.log("TabMenu is deprecated as of v18. Use tabs component instead https://primeng.org/tabs#tabmenu");
  }
  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (isPlatformBrowser(this.platformId)) {
      this.updateInkBar();
      this.initAutoScrollForActiveItem();
      this.initButtonState();
    }
  }
  ngAfterViewChecked() {
    if (isPlatformBrowser(this.platformId)) {
      this.updateInkBar();
      this.tabChanged = false;
    }
  }
  ngAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case "item":
          this._itemTemplate = item.template;
          break;
        case "nexticon":
          this._nextIconTemplate = item.template;
          break;
        case "previousicon":
          this._previousIconTemplate = item.template;
          break;
        default:
          this._itemTemplate = item.template;
          break;
      }
    });
  }
  ngOnDestroy() {
    this.clearAutoScrollHandler();
    super.ngOnDestroy();
  }
  isActive(item) {
    if (item.routerLink) {
      const routerLink = Array.isArray(item.routerLink) ? item.routerLink : [item.routerLink];
      return this.router.isActive(this.router.createUrlTree(routerLink, {
        relativeTo: this.route
      }).toString(), item.routerLinkActiveOptions?.exact ?? item.routerLinkActiveOptions ?? false);
    }
    return item === this.activeItem;
  }
  getItemProp(item, name) {
    return item ? resolve(item[name]) : void 0;
  }
  visible(item) {
    return typeof item.visible === "function" ? item.visible() : item.visible !== false;
  }
  disabled(item) {
    return typeof item.disabled === "function" ? item.disabled() : item.disabled;
  }
  onMenuItemFocus(item) {
    this.focusedItemInfo.set(item);
  }
  itemClick(event, item) {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (!item.url && !item.routerLink) {
      event.preventDefault();
    }
    if (item.command) {
      item.command({
        originalEvent: event,
        item
      });
    }
    this.activeItem = item;
    this.activeItemChange.emit(item);
    this.tabChanged = true;
    this.cd.markForCheck();
  }
  onKeydownItem(event, index, item) {
    let i = index;
    let foundElement = {};
    const tabs = this.tab.toArray();
    switch (event.code) {
      case "ArrowRight":
        foundElement = this.findNextItem(tabs, i);
        i = foundElement["i"];
        this.changeFocusedTab(event, foundElement["nextItem"], i);
        break;
      case "ArrowLeft":
        foundElement = this.findPrevItem(tabs, i);
        i = foundElement["i"];
        this.changeFocusedTab(event, foundElement["prevItem"], i);
        break;
      case "End":
        foundElement = this.findPrevItem(tabs, this.model.length);
        i = foundElement["i"];
        this.changeFocusedTab(event, foundElement["prevItem"], i);
        event.preventDefault();
        break;
      case "Home":
        foundElement = this.findNextItem(tabs, -1);
        i = foundElement["i"];
        this.changeFocusedTab(event, foundElement["nextItem"], i);
        event.preventDefault();
        break;
      case "Space":
      case "Enter":
        this.itemClick(event, item);
        break;
      case "Tab":
        this.onTabKeyDown(tabs);
        break;
      default:
        break;
    }
    if (tabs[i] && tabs[index]) {
      tabs[index].nativeElement.tabIndex = "-1";
      tabs[i].nativeElement.tabIndex = "0";
      tabs[i].nativeElement.focus();
    }
    this.cd.markForCheck();
  }
  onTabKeyDown(tabLinks) {
    tabLinks.forEach((item) => {
      item.nativeElement.tabIndex = getAttribute(item.nativeElement.parentElement, "data-p-highlight") ? "0" : "-1";
    });
  }
  changeFocusedTab(event, element, index) {
    if (element) {
      focus(element);
      element.scrollIntoView({
        block: "nearest"
      });
      this.itemClick(event, element);
    }
  }
  findNextItem(items, index) {
    let i = index + 1;
    if (i >= items.length) {
      return {
        nextItem: items[items.length],
        i: items.length
      };
    }
    let nextItem = items[i];
    if (nextItem) return getAttribute(nextItem.nativeElement, "data-p-disabled") ? this.findNextItem(items, i) : {
      nextItem: nextItem.nativeElement,
      i
    };
    else return null;
  }
  findPrevItem(items, index) {
    let i = index - 1;
    if (i < 0) {
      return {
        prevItem: items[0],
        i: 0
      };
    }
    let prevItem = items[i];
    if (prevItem) return getAttribute(prevItem.nativeElement, "data-p-disabled") ? this.findPrevItem(items, i) : {
      prevItem: prevItem.nativeElement,
      i
    };
    else return null;
  }
  updateInkBar() {
    const tabHeader = findSingle(this.navbar?.nativeElement, "li.p-tabmenu-active");
    if (tabHeader) {
      this.inkbar.nativeElement.style.width = getWidth(tabHeader) + "px";
      this.inkbar.nativeElement.style.left = getOffset(tabHeader).left - getOffset(this.navbar?.nativeElement).left + "px";
    }
  }
  getVisibleButtonWidths() {
    return [this.prevBtn?.nativeElement, this.nextBtn?.nativeElement].reduce((acc, el) => el ? acc + getWidth(el) : acc, 0);
  }
  updateButtonState() {
    const content = this.content?.nativeElement;
    const {
      scrollLeft,
      scrollWidth
    } = content;
    const width = getWidth(content);
    this.backwardIsDisabled = scrollLeft === 0;
    this.forwardIsDisabled = parseInt(scrollLeft) === scrollWidth - width;
  }
  updateScrollBar(index) {
    const tabHeader = this.navbar?.nativeElement.children[index];
    if (!tabHeader) {
      return;
    }
    tabHeader.scrollIntoView({
      block: "nearest"
    });
  }
  onScroll(event) {
    this.scrollable && this.updateButtonState();
    event.preventDefault();
  }
  navBackward() {
    const content = this.content?.nativeElement;
    const width = getWidth(content) - this.getVisibleButtonWidths();
    const pos = content.scrollLeft - width;
    content.scrollLeft = pos <= 0 ? 0 : pos;
  }
  navForward() {
    const content = this.content?.nativeElement;
    const width = getWidth(content) - this.getVisibleButtonWidths();
    const pos = content.scrollLeft + width;
    const lastPos = content.scrollWidth - width;
    content.scrollLeft = pos >= lastPos ? lastPos : pos;
  }
  initAutoScrollForActiveItem() {
    if (!this.scrollable) {
      return;
    }
    this.clearAutoScrollHandler();
    this.timerIdForInitialAutoScroll = setTimeout(() => {
      const activeItem = this.model.findIndex((menuItem) => this.isActive(menuItem));
      if (activeItem !== -1) {
        this.updateScrollBar(activeItem);
      }
    });
  }
  clearAutoScrollHandler() {
    if (this.timerIdForInitialAutoScroll) {
      clearTimeout(this.timerIdForInitialAutoScroll);
      this.timerIdForInitialAutoScroll = null;
    }
  }
  initButtonState() {
    if (this.scrollable) {
      Promise.resolve().then(() => {
        this.updateButtonState();
        this.cd.markForCheck();
      });
    }
  }
  static ɵfac = function TabMenu_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TabMenu)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _TabMenu,
    selectors: [["p-tabMenu"], ["p-tabmenu"]],
    contentQueries: function TabMenu_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, _c0, 4);
        ɵɵcontentQuery(dirIndex, _c1, 4);
        ɵɵcontentQuery(dirIndex, _c2, 4);
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.itemTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.previousIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.nextIconTemplate = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    viewQuery: function TabMenu_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c3, 5);
        ɵɵviewQuery(_c4, 5);
        ɵɵviewQuery(_c5, 5);
        ɵɵviewQuery(_c6, 5);
        ɵɵviewQuery(_c7, 5);
        ɵɵviewQuery(_c8, 5);
        ɵɵviewQuery(_c9, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.content = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.navbar = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.inkbar = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.prevBtn = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.nextBtn = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.tabLink = _t);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.tab = _t);
      }
    },
    inputs: {
      model: "model",
      activeItem: "activeItem",
      scrollable: [2, "scrollable", "scrollable", booleanAttribute],
      popup: [2, "popup", "popup", booleanAttribute],
      style: "style",
      styleClass: "styleClass",
      ariaLabel: "ariaLabel",
      ariaLabelledBy: "ariaLabelledBy"
    },
    outputs: {
      activeItemChange: "activeItemChange"
    },
    features: [ɵɵProvidersFeature([TabMenuStyle]), ɵɵInheritDefinitionFeature],
    decls: 11,
    vars: 12,
    consts: [["content", ""], ["navbar", ""], ["inkbar", ""], ["prevBtn", ""], ["tab", ""], ["tabLink", ""], ["htmlLabel", ""], ["htmlRouteLabel", ""], ["nextBtn", ""], [3, "ngClass", "ngStyle"], [1, "p-tabmenu-nav-container"], ["class", "p-tabmenu-nav-prev-button p-tabmenu-nav-button", "type", "button", "role", "navigation", "pRipple", "", 3, "click", 4, "ngIf"], [1, "p-tabmenu-nav-content", 3, "scroll"], ["role", "menubar", 1, "p-tabmenu-nav", "p-reset"], ["role", "menuitem", "pTooltip", "", "pRipple", "", 3, "ngStyle", "class", "ngClass", "tooltipOptions", "click", "keydown", "focus", 4, "ngFor", "ngForOf"], ["role", "presentation", 1, "p-tabmenuitem-active-bar"], ["class", "p-tabmenu-nav-next-button p-tabmenu-nav-button", "type", "button", "role", "navigation", "pRipple", "", 3, "click", 4, "ngIf"], ["type", "button", "role", "navigation", "pRipple", "", 1, "p-tabmenu-nav-prev-button", "p-tabmenu-nav-button", 3, "click"], [4, "ngIf"], [4, "ngTemplateOutlet"], ["role", "menuitem", "pTooltip", "", "pRipple", "", 3, "click", "keydown", "focus", "ngStyle", "ngClass", "tooltipOptions"], ["class", "p-menuitem-link", "role", "presentation", 3, "target", "tabindex", 4, "ngIf"], ["role", "presentation", "class", "p-menuitem-link", 3, "routerLink", "queryParams", "routerLinkActive", "routerLinkActiveOptions", "target", "tabindex", "fragment", "queryParamsHandling", "preserveFragment", "skipLocationChange", "replaceUrl", "state", 4, "ngIf"], [4, "ngTemplateOutlet", "ngTemplateOutletContext"], ["role", "presentation", 1, "p-menuitem-link", 3, "target", "tabindex"], ["class", "p-menuitem-icon", 3, "ngClass", "ngStyle", 4, "ngIf"], ["class", "p-menuitem-text", 4, "ngIf", "ngIfElse"], ["size", "small", 3, "styleClass", "value", 4, "ngIf"], [1, "p-menuitem-icon", 3, "ngClass", "ngStyle"], [1, "p-menuitem-text"], [1, "p-menuitem-text", 3, "innerHTML"], ["size", "small", 3, "styleClass", "value"], ["role", "presentation", 1, "p-menuitem-link", 3, "routerLink", "queryParams", "routerLinkActive", "routerLinkActiveOptions", "target", "tabindex", "fragment", "queryParamsHandling", "preserveFragment", "skipLocationChange", "replaceUrl", "state"], ["type", "button", "role", "navigation", "pRipple", "", 1, "p-tabmenu-nav-next-button", "p-tabmenu-nav-button", 3, "click"]],
    template: function TabMenu_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = ɵɵgetCurrentView();
        ɵɵelementStart(0, "div", 9)(1, "div", 10);
        ɵɵtemplate(2, TabMenu_button_2_Template, 4, 2, "button", 11);
        ɵɵelementStart(3, "div", 12, 0);
        ɵɵlistener("scroll", function TabMenu_Template_div_scroll_3_listener($event) {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onScroll($event));
        });
        ɵɵelementStart(5, "ul", 13, 1);
        ɵɵtemplate(7, TabMenu_li_7_Template, 5, 20, "li", 14);
        ɵɵelement(8, "li", 15, 2);
        ɵɵelementEnd()();
        ɵɵtemplate(10, TabMenu_button_10_Template, 4, 2, "button", 16);
        ɵɵelementEnd()();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.styleClass);
        ɵɵproperty("ngClass", ɵɵpureFunction1(10, _c10, ctx.scrollable))("ngStyle", ctx.style);
        ɵɵadvance(2);
        ɵɵproperty("ngIf", ctx.scrollable && !ctx.backwardIsDisabled);
        ɵɵadvance(3);
        ɵɵattribute("aria-labelledby", ctx.ariaLabelledBy)("aria-label", ctx.ariaLabel);
        ɵɵadvance(2);
        ɵɵproperty("ngForOf", ctx.focusableItems);
        ɵɵadvance();
        ɵɵattribute("data-pc-section", "inkbar");
        ɵɵadvance(2);
        ɵɵproperty("ngIf", ctx.scrollable && !ctx.forwardIsDisabled);
      }
    },
    dependencies: [CommonModule, NgClass, NgForOf, NgIf, NgTemplateOutlet, NgStyle, RouterModule, RouterLink, RouterLinkActive, Ripple, TooltipModule, Tooltip, ChevronLeftIcon, ChevronRightIcon, BadgeModule, Badge, SharedModule],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TabMenu, [{
    type: Component,
    args: [{
      selector: "p-tabMenu, p-tabmenu",
      standalone: true,
      imports: [CommonModule, RouterModule, Ripple, TooltipModule, ChevronLeftIcon, ChevronRightIcon, BadgeModule, SharedModule],
      template: `
        <div [ngClass]="{ 'p-tabmenu p-component': true, 'p-tabmenu-scrollable': scrollable }" [ngStyle]="style" [class]="styleClass">
            <div class="p-tabmenu-nav-container">
                <button *ngIf="scrollable && !backwardIsDisabled" #prevBtn class="p-tabmenu-nav-prev-button p-tabmenu-nav-button" (click)="navBackward()" type="button" role="navigation" pRipple>
                    <ChevronLeftIcon *ngIf="!previousIconTemplate && !_previousIconTemplate" [attr.aria-hidden]="true" />
                    <ng-template *ngTemplateOutlet="previousIconTemplate || _previousIconTemplate"></ng-template>
                </button>
                <div #content class="p-tabmenu-nav-content" (scroll)="onScroll($event)">
                    <ul #navbar class="p-tabmenu-nav p-reset" role="menubar" [attr.aria-labelledby]="ariaLabelledBy" [attr.aria-label]="ariaLabel">
                        <li
                            #tab
                            *ngFor="let item of focusableItems; let i = index"
                            role="menuitem"
                            [ngStyle]="item.style"
                            [class]="item.styleClass"
                            [attr.data-p-disabled]="disabled(item)"
                            [attr.data-p-highlight]="focusedItemInfo() === item"
                            (click)="itemClick($event, item)"
                            (keydown)="onKeydownItem($event, i, item)"
                            (focus)="onMenuItemFocus(item)"
                            [ngClass]="{
                                'p-tabmenuitem': true,
                                'p-disabled': getItemProp(item, 'disabled'),
                                'p-tabmenuitem-active': isActive(item),
                                'p-hidden': item.visible === false
                            }"
                            pTooltip
                            [tooltipOptions]="item.tooltipOptions"
                            pRipple
                            [attr.aria-label]="getItemProp(item, 'label')"
                            [attr.tabindex]="disabled(item) ? -1 : 0"
                        >
                            <a
                                #tabLink
                                *ngIf="!item.routerLink && !itemTemplate && !_itemTemplate"
                                class="p-menuitem-link"
                                role="presentation"
                                [attr.href]="getItemProp(item, 'url')"
                                [attr.id]="getItemProp(item, 'id')"
                                [attr.aria-disabled]="disabled(item)"
                                [target]="getItemProp(item, 'target')"
                                [tabindex]="-1"
                            >
                                <ng-container>
                                    <span class="p-menuitem-icon" [ngClass]="item.icon" *ngIf="item.icon" [ngStyle]="item.iconStyle"></span>
                                    <span class="p-menuitem-text" *ngIf="item.escape !== false; else htmlLabel">{{ getItemProp(item, 'label') }}</span>
                                    <ng-template #htmlLabel><span class="p-menuitem-text" [innerHTML]="getItemProp(item, 'label')"></span></ng-template>
                                    <p-badge *ngIf="item.badge" [styleClass]="item.badgeStyleClass" [value]="getItemProp(item, 'badge')" size="small" />
                                </ng-container>
                            </a>
                            <a
                                #tabLink
                                *ngIf="item.routerLink && !itemTemplate && !_itemTemplate"
                                [routerLink]="item.routerLink"
                                [queryParams]="item.queryParams"
                                [routerLinkActive]="'p-menuitem-link-active'"
                                [routerLinkActiveOptions]="item.routerLinkActiveOptions || { exact: false }"
                                role="presentation"
                                class="p-menuitem-link"
                                [target]="item.target"
                                [attr.id]="getItemProp(item, 'id')"
                                [attr.aria-disabled]="disabled(item)"
                                [tabindex]="-1"
                                [fragment]="item.fragment"
                                [queryParamsHandling]="item.queryParamsHandling"
                                [preserveFragment]="item.preserveFragment"
                                [skipLocationChange]="item.skipLocationChange"
                                [replaceUrl]="item.replaceUrl"
                                [state]="item.state"
                            >
                                <ng-container>
                                    <span class="p-menuitem-icon" [attr.aria-hidden]="true" [ngClass]="item.icon" *ngIf="item.icon" [ngStyle]="item.iconStyle"></span>
                                    <span class="p-menuitem-text" *ngIf="item.escape !== false; else htmlRouteLabel">{{ getItemProp(item, 'label') }}</span>
                                    <ng-template #htmlRouteLabel><span class="p-menuitem-text" [innerHTML]="getItemProp(item, 'label')"></span></ng-template>
                                    <p-badge *ngIf="item.badge" [styleClass]="item.badgeStyleClass" [value]="getItemProp(item, 'badge')" size="small" />
                                </ng-container>
                            </a>
                            <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item, index: i }"></ng-container>
                        </li>
                        <li #inkbar class="p-tabmenuitem-active-bar" role="presentation" [attr.data-pc-section]="'inkbar'"></li>
                    </ul>
                </div>
                <button *ngIf="scrollable && !forwardIsDisabled" #nextBtn class="p-tabmenu-nav-next-button p-tabmenu-nav-button" (click)="navForward()" type="button" role="navigation" pRipple>
                    <ChevronRightIcon *ngIf="!previousIconTemplate && !_previousIconTemplate" [attr.aria-hidden]="true" />
                    <ng-template *ngTemplateOutlet="nextIconTemplate || _nextIconTemplate"></ng-template>
                </button>
            </div>
        </div>
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      providers: [TabMenuStyle]
    }]
  }], () => [], {
    model: [{
      type: Input
    }],
    activeItem: [{
      type: Input
    }],
    scrollable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    popup: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    style: [{
      type: Input
    }],
    styleClass: [{
      type: Input
    }],
    ariaLabel: [{
      type: Input
    }],
    ariaLabelledBy: [{
      type: Input
    }],
    activeItemChange: [{
      type: Output
    }],
    content: [{
      type: ViewChild,
      args: ["content"]
    }],
    navbar: [{
      type: ViewChild,
      args: ["navbar"]
    }],
    inkbar: [{
      type: ViewChild,
      args: ["inkbar"]
    }],
    prevBtn: [{
      type: ViewChild,
      args: ["prevBtn"]
    }],
    nextBtn: [{
      type: ViewChild,
      args: ["nextBtn"]
    }],
    tabLink: [{
      type: ViewChildren,
      args: ["tabLink"]
    }],
    tab: [{
      type: ViewChildren,
      args: ["tab"]
    }],
    itemTemplate: [{
      type: ContentChild,
      args: ["item", {
        descendants: false
      }]
    }],
    previousIconTemplate: [{
      type: ContentChild,
      args: ["previousicon", {
        descendants: false
      }]
    }],
    nextIconTemplate: [{
      type: ContentChild,
      args: ["nexticon", {
        descendants: false
      }]
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var TabMenuModule = class _TabMenuModule {
  static ɵfac = function TabMenuModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TabMenuModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _TabMenuModule,
    imports: [TabMenu, SharedModule],
    exports: [TabMenu, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [TabMenu, SharedModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TabMenuModule, [{
    type: NgModule,
    args: [{
      imports: [TabMenu, SharedModule],
      exports: [TabMenu, SharedModule]
    }]
  }], null, null);
})();
export {
  TabMenu,
  TabMenuClasses,
  TabMenuModule,
  TabMenuStyle
};
//# sourceMappingURL=primeng_tabmenu.js.map
