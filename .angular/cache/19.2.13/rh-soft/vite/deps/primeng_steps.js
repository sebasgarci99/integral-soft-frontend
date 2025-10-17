import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterModule
} from "./chunk-N7EM5UTR.js";
import {
  Tooltip,
  TooltipModule
} from "./chunk-ZWBNV3XB.js";
import "./chunk-DCVU3JPE.js";
import "./chunk-JVBOKW6K.js";
import "./chunk-NMOYQVAO.js";
import "./chunk-TTPXWPGZ.js";
import "./chunk-5G7WYC4N.js";
import {
  BaseComponent
} from "./chunk-HOW5VWZN.js";
import "./chunk-ORPSEVGH.js";
import {
  BaseStyle
} from "./chunk-6TA5B4NM.js";
import {
  SharedModule,
  find,
  findSingle
} from "./chunk-SN7RFI2O.js";
import {
  CommonModule,
  NgClass,
  NgIf,
  NgStyle
} from "./chunk-OL7WVFLG.js";
import "./chunk-P3LJCSKC.js";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injectable,
  Input,
  NgModule,
  Output,
  ViewChild,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  numberAttribute,
  setClassMetadata,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵelement,
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
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
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

// node_modules/primeng/fesm2022/primeng-steps.mjs
var _c0 = ["list"];
var _c1 = (a0) => ({
  "p-steps p-component": true,
  "p-readonly": a0
});
var _c2 = (a0, a1) => ({
  "p-steps-item-active": a0,
  "p-disabled": a1
});
var _c3 = () => ({
  exact: false
});
var _forTrack0 = ($index, $item) => $item.label;
function Steps_For_4_li_0_a_2_span_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 14);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r3 = ɵɵnextContext(3).$implicit;
    ɵɵadvance();
    ɵɵtextInterpolate(item_r3.label);
  }
}
function Steps_For_4_li_0_a_2_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 15);
  }
  if (rf & 2) {
    const item_r3 = ɵɵnextContext(3).$implicit;
    ɵɵproperty("innerHTML", item_r3.label, ɵɵsanitizeHtml);
  }
}
function Steps_For_4_li_0_a_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "a", 11);
    ɵɵlistener("click", function Steps_For_4_li_0_a_2_Template_a_click_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      const item_r3 = ctx_r1.$implicit;
      const ɵ$index_5_r4 = ctx_r1.$index;
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onItemClick($event, item_r3, ɵ$index_5_r4));
    })("keydown", function Steps_For_4_li_0_a_2_Template_a_keydown_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      const item_r3 = ctx_r1.$implicit;
      const ɵ$index_5_r4 = ctx_r1.$index;
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onItemKeydown($event, item_r3, ɵ$index_5_r4));
    });
    ɵɵelementStart(1, "span", 12);
    ɵɵtext(2);
    ɵɵelementEnd();
    ɵɵtemplate(3, Steps_For_4_li_0_a_2_span_3_Template, 2, 1, "span", 13)(4, Steps_For_4_li_0_a_2_ng_template_4_Template, 1, 1, "ng-template", null, 3, ɵɵtemplateRefExtractor);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const htmlLabel_r6 = ɵɵreference(5);
    const ctx_r1 = ɵɵnextContext(2);
    const item_r3 = ctx_r1.$implicit;
    const ɵ$index_5_r4 = ctx_r1.$index;
    const ctx_r4 = ɵɵnextContext();
    ɵɵproperty("routerLink", item_r3.routerLink)("queryParams", item_r3.queryParams)("routerLinkActiveOptions", item_r3.routerLinkActiveOptions || ɵɵpureFunction0(17, _c3))("target", item_r3.target)("fragment", item_r3.fragment)("queryParamsHandling", item_r3.queryParamsHandling)("preserveFragment", item_r3.preserveFragment)("skipLocationChange", item_r3.skipLocationChange)("replaceUrl", item_r3.replaceUrl)("state", item_r3.state);
    ɵɵattribute("tabindex", ctx_r4.getItemTabIndex(item_r3, ɵ$index_5_r4))("aria-expanded", ɵ$index_5_r4 === ctx_r4.activeIndex)("aria-disabled", item_r3.disabled || ctx_r4.readonly && ɵ$index_5_r4 !== ctx_r4.activeIndex)("ariaCurrentWhenActive", ctx_r4.exact ? "step" : void 0);
    ɵɵadvance(2);
    ɵɵtextInterpolate(ɵ$index_5_r4 + 1);
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r3.escape !== false)("ngIfElse", htmlLabel_r6);
  }
}
function Steps_For_4_li_0_ng_template_3_span_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 14);
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r3 = ɵɵnextContext(3).$implicit;
    ɵɵadvance();
    ɵɵtextInterpolate(item_r3.label);
  }
}
function Steps_For_4_li_0_ng_template_3_ng_template_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 15);
  }
  if (rf & 2) {
    const item_r3 = ɵɵnextContext(3).$implicit;
    ɵɵproperty("innerHTML", item_r3.label, ɵɵsanitizeHtml);
  }
}
function Steps_For_4_li_0_ng_template_3_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "a", 16);
    ɵɵlistener("click", function Steps_For_4_li_0_ng_template_3_Template_a_click_0_listener($event) {
      ɵɵrestoreView(_r7);
      const ctx_r1 = ɵɵnextContext(2);
      const item_r3 = ctx_r1.$implicit;
      const ɵ$index_5_r4 = ctx_r1.$index;
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onItemClick($event, item_r3, ɵ$index_5_r4));
    })("keydown", function Steps_For_4_li_0_ng_template_3_Template_a_keydown_0_listener($event) {
      ɵɵrestoreView(_r7);
      const ctx_r1 = ɵɵnextContext(2);
      const item_r3 = ctx_r1.$implicit;
      const ɵ$index_5_r4 = ctx_r1.$index;
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onItemKeydown($event, item_r3, ɵ$index_5_r4));
    });
    ɵɵelementStart(1, "span", 12);
    ɵɵtext(2);
    ɵɵelementEnd();
    ɵɵtemplate(3, Steps_For_4_li_0_ng_template_3_span_3_Template, 2, 1, "span", 13)(4, Steps_For_4_li_0_ng_template_3_ng_template_4_Template, 1, 1, "ng-template", null, 4, ɵɵtemplateRefExtractor);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const htmlRouteLabel_r8 = ɵɵreference(5);
    const ctx_r1 = ɵɵnextContext(2);
    const item_r3 = ctx_r1.$implicit;
    const ɵ$index_5_r4 = ctx_r1.$index;
    const ctx_r4 = ɵɵnextContext();
    ɵɵproperty("target", item_r3.target);
    ɵɵattribute("href", item_r3.url, ɵɵsanitizeUrl)("tabindex", ctx_r4.getItemTabIndex(item_r3, ɵ$index_5_r4))("aria-expanded", ɵ$index_5_r4 === ctx_r4.activeIndex)("aria-disabled", item_r3.disabled || ctx_r4.readonly && ɵ$index_5_r4 !== ctx_r4.activeIndex)("ariaCurrentWhenActive", ctx_r4.exact && (!item_r3.disabled || ctx_r4.readonly) ? "step" : void 0);
    ɵɵadvance(2);
    ɵɵtextInterpolate(ɵ$index_5_r4 + 1);
    ɵɵadvance();
    ɵɵproperty("ngIf", item_r3.escape !== false)("ngIfElse", htmlRouteLabel_r8);
  }
}
function Steps_For_4_li_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "li", 9, 1);
    ɵɵtemplate(2, Steps_For_4_li_0_a_2_Template, 6, 18, "a", 10)(3, Steps_For_4_li_0_ng_template_3_Template, 6, 9, "ng-template", null, 2, ɵɵtemplateRefExtractor);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const elseBlock_r9 = ɵɵreference(4);
    const ctx_r1 = ɵɵnextContext();
    const item_r3 = ctx_r1.$implicit;
    const ɵ$index_5_r4 = ctx_r1.$index;
    const ctx_r4 = ɵɵnextContext();
    ɵɵclassMap(item_r3.styleClass);
    ɵɵproperty("ngStyle", item_r3.style)("tooltipOptions", item_r3.tooltipOptions)("ngClass", ɵɵpureFunction2(10, _c2, ctx_r4.isActive(item_r3, ɵ$index_5_r4), item_r3.disabled || ctx_r4.readonly && !ctx_r4.isActive(item_r3, ɵ$index_5_r4)));
    ɵɵattribute("aria-current", ctx_r4.isActive(item_r3, ɵ$index_5_r4) ? "step" : void 0)("id", item_r3.id)("data-pc-section", "menuitem");
    ɵɵadvance(2);
    ɵɵproperty("ngIf", ctx_r4.isClickableRouterLink(item_r3))("ngIfElse", elseBlock_r9);
  }
}
function Steps_For_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, Steps_For_4_li_0_Template, 5, 13, "li", 8);
  }
  if (rf & 2) {
    const item_r3 = ctx.$implicit;
    ɵɵproperty("ngIf", item_r3.visible !== false);
  }
}
var theme = ({
  dt
}) => `
.p-steps {
    position: relative;
}

.p-steps-list {
    padding: 0;
    margin: 0;
    list-style-type: none;
    display: flex;
}

.p-steps-item {
    position: relative;
    display: flex;
    justify-content: center;
    flex: 1 1 auto;
}

.p-steps-item.p-disabled,
.p-steps-item.p-disabled * {
    opacity: 1;
    pointer-events: auto;
    user-select: auto;
    cursor: auto;
}

.p-steps-item:before {
    content: " ";
    border-top: 2px solid ${dt("steps.separator.background")};
    width: 100%;
    top: 50%;
    left: 0;
    display: block;
    position: absolute;
    margin-top: -1rem;
    margin-top: calc(-1rem + 1px);
}

.p-steps-item:first-child::before {
    width: calc(50% + 1rem);
    transform: translateX(100%);
}

.p-steps-item:last-child::before {
    width: 50%;
}

.p-steps-item-link {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    text-decoration: none;
    transition: outline-color ${dt("steps.transition.duration")}, box-shadow ${dt("steps.transition.duration")};
    border-radius: ${dt("steps.item.link.border.radius")};
    outline-color: transparent;
    gap: ${dt("steps.item.link.gap")};
}

.p-steps-item-link:not(.p-disabled):focus-visible {
    box-shadow: ${dt("steps.item.link.focus.ring.shadow")};
    outline: ${dt("steps.item.link.focus.ring.width")} ${dt("steps.item.link.focus.ring.style")} ${dt("steps.item.link.focus.ring.color")};
    outline-offset: ${dt("steps.item.link.focus.ring.offset")};
}

.p-steps-item-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    color: ${dt("steps.item.label.color")};
    display: block;
    font-weight: ${dt("steps.item.label.font.weight")};
}

.p-steps-item-number {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${dt("steps.item.number.color")};
    border: 2px solid ${dt("steps.item.number.border.color")};
    background: ${dt("steps.item.number.background")};
    min-width: ${dt("steps.item.number.size")};
    height: ${dt("steps.item.number.size")};
    line-height: ${dt("steps.item.number.size")};
    font-size: ${dt("steps.item.number.font.size")};
    z-index: 1;
    border-radius: ${dt("steps.item.number.border.radius")};
    position: relative;
    font-weight: ${dt("steps.item.number.font.weight")};
}

.p-steps-item-number::after {
    content: " ";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: ${dt("steps.item.number.border.radius")};
    box-shadow: ${dt("steps.item.number.shadow")};
}

.p-steps:not(.p-readonly) .p-steps-item {
    cursor: pointer;
}

.p-steps-item-active .p-steps-item-number {
    background: ${dt("steps.item.number.active.background")};
    border-color: ${dt("steps.item.number.active.border.color")};
    color: ${dt("steps.item.number.active.color")};
}

.p-steps-item-active .p-steps-item-label {
    color: ${dt("steps.item.label.active.color")};
}
`;
var classes = {
  root: ({
    props
  }) => ["p-steps p-component", {
    "p-readonly": props.readonly
  }],
  list: "p-steps-list",
  item: ({
    instance,
    item,
    index
  }) => ["p-steps-item", {
    "p-steps-item-active": instance.isActive(index),
    "p-disabled": instance.isItemDisabled(item, index)
  }],
  itemLink: "p-steps-item-link",
  itemNumber: "p-steps-item-number",
  itemLabel: "p-steps-item-label"
};
var StepsStyle = class _StepsStyle extends BaseStyle {
  name = "steps";
  theme = theme;
  classes = classes;
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵStepsStyle_BaseFactory;
    return function StepsStyle_Factory(__ngFactoryType__) {
      return (ɵStepsStyle_BaseFactory || (ɵStepsStyle_BaseFactory = ɵɵgetInheritedFactory(_StepsStyle)))(__ngFactoryType__ || _StepsStyle);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _StepsStyle,
    factory: _StepsStyle.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StepsStyle, [{
    type: Injectable
  }], null, null);
})();
var StepsClasses;
(function(StepsClasses2) {
  StepsClasses2["root"] = "p-steps";
  StepsClasses2["list"] = "p-steps-list";
  StepsClasses2["item"] = "p-steps-item";
  StepsClasses2["itemLink"] = "p-steps-item-link";
  StepsClasses2["itemNumber"] = "p-steps-item-number";
  StepsClasses2["itemLabel"] = "p-steps-item-label";
})(StepsClasses || (StepsClasses = {}));
var Steps = class _Steps extends BaseComponent {
  /**
   * Index of the active item.
   * @group Props
   */
  activeIndex = 0;
  /**
   * An array of menu items.
   * @group Props
   */
  model;
  /**
   * Whether the items are clickable or not.
   * @group Props
   */
  readonly = true;
  /**
   * Inline style of the component.
   * @group Props
   */
  style;
  /**
   * Style class of the component.
   * @group Props
   */
  styleClass;
  /**
   * Whether to apply 'router-link-active-exact' class if route exactly matches the item path.
   * @group Props
   */
  exact = true;
  /**
   * Callback to invoke when the new step is selected.
   * @param {number} number - current index.
   * @group Emits
   */
  activeIndexChange = new EventEmitter();
  listViewChild;
  router = inject(Router);
  route = inject(ActivatedRoute);
  _componentStyle = inject(StepsStyle);
  subscription;
  ngOnInit() {
    super.ngOnInit();
    this.subscription = this.router.events.subscribe(() => this.cd.markForCheck());
  }
  onItemClick(event, item, i) {
    if (this.readonly || item.disabled) {
      event.preventDefault();
      return;
    }
    this.activeIndexChange.emit(i);
    if (!item.url && !item.routerLink) {
      event.preventDefault();
    }
    if (item.command) {
      item.command({
        originalEvent: event,
        item,
        index: i
      });
    }
  }
  onItemKeydown(event, item, i) {
    switch (event.code) {
      case "ArrowRight": {
        this.navigateToNextItem(event.target);
        event.preventDefault();
        break;
      }
      case "ArrowLeft": {
        this.navigateToPrevItem(event.target);
        event.preventDefault();
        break;
      }
      case "Home": {
        this.navigateToFirstItem(event.target);
        event.preventDefault();
        break;
      }
      case "End": {
        this.navigateToLastItem(event.target);
        event.preventDefault();
        break;
      }
      case "Tab":
        if (i !== this.activeIndex) {
          const siblings = find(this.listViewChild.nativeElement, '[data-pc-section="menuitem"]');
          siblings[i].children[0].tabIndex = "-1";
          siblings[this.activeIndex].children[0].tabIndex = "0";
        }
        break;
      case "Enter":
      case "Space": {
        this.onItemClick(event, item, i);
        event.preventDefault();
        break;
      }
      default:
        break;
    }
  }
  navigateToNextItem(target) {
    const nextItem = this.findNextItem(target);
    nextItem && this.setFocusToMenuitem(target, nextItem);
  }
  navigateToPrevItem(target) {
    const prevItem = this.findPrevItem(target);
    prevItem && this.setFocusToMenuitem(target, prevItem);
  }
  navigateToFirstItem(target) {
    const firstItem = this.findFirstItem();
    firstItem && this.setFocusToMenuitem(target, firstItem);
  }
  navigateToLastItem(target) {
    const lastItem = this.findLastItem();
    lastItem && this.setFocusToMenuitem(target, lastItem);
  }
  findNextItem(item) {
    const nextItem = item.parentElement.nextElementSibling;
    return nextItem ? nextItem.children[0] : null;
  }
  findPrevItem(item) {
    const prevItem = item.parentElement.previousElementSibling;
    return prevItem ? prevItem.children[0] : null;
  }
  findFirstItem() {
    const firstSibling = findSingle(this.listViewChild.nativeElement, '[data-pc-section="menuitem"]');
    return firstSibling ? firstSibling.children[0] : null;
  }
  findLastItem() {
    const siblings = find(this.listViewChild.nativeElement, '[data-pc-section="menuitem"]');
    return siblings ? siblings[siblings.length - 1].children[0] : null;
  }
  setFocusToMenuitem(target, focusableItem) {
    target.tabIndex = "-1";
    focusableItem.tabIndex = "0";
    focusableItem.focus();
  }
  isClickableRouterLink(item) {
    return item.routerLink && !this.readonly && !item.disabled;
  }
  isActive(item, index) {
    if (item.routerLink) {
      let routerLink = Array.isArray(item.routerLink) ? item.routerLink : [item.routerLink];
      return this.router.isActive(this.router.createUrlTree(routerLink, {
        relativeTo: this.route
      }).toString(), false);
    }
    return index === this.activeIndex;
  }
  getItemTabIndex(item, index) {
    if (item.disabled) {
      return "-1";
    }
    if (!item.disabled && this.activeIndex === index) {
      return item.tabindex || "0";
    }
    return item.tabindex ?? "-1";
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    super.ngOnDestroy();
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵSteps_BaseFactory;
    return function Steps_Factory(__ngFactoryType__) {
      return (ɵSteps_BaseFactory || (ɵSteps_BaseFactory = ɵɵgetInheritedFactory(_Steps)))(__ngFactoryType__ || _Steps);
    };
  })();
  static ɵcmp = ɵɵdefineComponent({
    type: _Steps,
    selectors: [["p-steps"]],
    viewQuery: function Steps_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.listViewChild = _t.first);
      }
    },
    inputs: {
      activeIndex: [2, "activeIndex", "activeIndex", numberAttribute],
      model: "model",
      readonly: [2, "readonly", "readonly", booleanAttribute],
      style: "style",
      styleClass: "styleClass",
      exact: [2, "exact", "exact", booleanAttribute]
    },
    outputs: {
      activeIndexChange: "activeIndexChange"
    },
    features: [ɵɵProvidersFeature([StepsStyle]), ɵɵInheritDefinitionFeature],
    decls: 5,
    vars: 8,
    consts: [["list", ""], ["menuitem", ""], ["elseBlock", ""], ["htmlLabel", ""], ["htmlRouteLabel", ""], [3, "ngClass", "ngStyle"], [1, "p-steps-list"], ["pTooltip", "", 1, "p-steps-item", 3, "ngStyle", "class", "tooltipOptions", "ngClass"], ["class", "p-steps-item", "pTooltip", "", 3, "ngStyle", "class", "tooltipOptions", "ngClass", 4, "ngIf"], ["pTooltip", "", 1, "p-steps-item", 3, "ngStyle", "tooltipOptions", "ngClass"], ["role", "link", "class", "p-steps-item-link", 3, "routerLink", "queryParams", "routerLinkActiveOptions", "target", "fragment", "queryParamsHandling", "preserveFragment", "skipLocationChange", "replaceUrl", "state", "click", "keydown", 4, "ngIf", "ngIfElse"], ["role", "link", 1, "p-steps-item-link", 3, "click", "keydown", "routerLink", "queryParams", "routerLinkActiveOptions", "target", "fragment", "queryParamsHandling", "preserveFragment", "skipLocationChange", "replaceUrl", "state"], [1, "p-steps-item-number"], ["class", "p-steps-item-label", 4, "ngIf", "ngIfElse"], [1, "p-steps-item-label"], [1, "p-steps-item-label", 3, "innerHTML"], ["role", "link", 1, "p-steps-item-link", 3, "click", "keydown", "target"]],
    template: function Steps_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "nav", 5)(1, "ul", 6, 0);
        ɵɵrepeaterCreate(3, Steps_For_4_Template, 1, 1, "li", 7, _forTrack0);
        ɵɵelementEnd()();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.styleClass);
        ɵɵproperty("ngClass", ɵɵpureFunction1(6, _c1, ctx.readonly))("ngStyle", ctx.style);
        ɵɵattribute("data-pc-name", "steps");
        ɵɵadvance();
        ɵɵattribute("data-pc-section", "menu");
        ɵɵadvance(2);
        ɵɵrepeater(ctx.model);
      }
    },
    dependencies: [CommonModule, NgClass, NgIf, NgStyle, RouterModule, RouterLink, TooltipModule, Tooltip, SharedModule],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Steps, [{
    type: Component,
    args: [{
      selector: "p-steps",
      standalone: true,
      imports: [CommonModule, RouterModule, TooltipModule, SharedModule],
      template: `
        <nav [ngClass]="{ 'p-steps p-component': true, 'p-readonly': readonly }" [ngStyle]="style" [class]="styleClass" [attr.data-pc-name]="'steps'">
            <ul #list [attr.data-pc-section]="'menu'" class="p-steps-list">
                @for (item of model; track item.label; let i = $index) {
                    <li
                        *ngIf="item.visible !== false"
                        class="p-steps-item"
                        #menuitem
                        [ngStyle]="item.style"
                        [class]="item.styleClass"
                        [attr.aria-current]="isActive(item, i) ? 'step' : undefined"
                        [attr.id]="item.id"
                        pTooltip
                        [tooltipOptions]="item.tooltipOptions"
                        [ngClass]="{
                            'p-steps-item-active': isActive(item, i),
                            'p-disabled': item.disabled || (readonly && !isActive(item, i))
                        }"
                        [attr.data-pc-section]="'menuitem'"
                    >
                        <a
                            role="link"
                            *ngIf="isClickableRouterLink(item); else elseBlock"
                            [routerLink]="item.routerLink"
                            [queryParams]="item.queryParams"
                            [routerLinkActiveOptions]="item.routerLinkActiveOptions || { exact: false }"
                            class="p-steps-item-link"
                            (click)="onItemClick($event, item, i)"
                            (keydown)="onItemKeydown($event, item, i)"
                            [target]="item.target"
                            [attr.tabindex]="getItemTabIndex(item, i)"
                            [attr.aria-expanded]="i === activeIndex"
                            [attr.aria-disabled]="item.disabled || (readonly && i !== activeIndex)"
                            [fragment]="item.fragment"
                            [queryParamsHandling]="item.queryParamsHandling"
                            [preserveFragment]="item.preserveFragment"
                            [skipLocationChange]="item.skipLocationChange"
                            [replaceUrl]="item.replaceUrl"
                            [state]="item.state"
                            [attr.ariaCurrentWhenActive]="exact ? 'step' : undefined"
                        >
                            <span class="p-steps-item-number">{{ i + 1 }}</span>
                            <span class="p-steps-item-label" *ngIf="item.escape !== false; else htmlLabel">{{ item.label }}</span>
                            <ng-template #htmlLabel><span class="p-steps-item-label" [innerHTML]="item.label"></span></ng-template>
                        </a>
                        <ng-template #elseBlock>
                            <a
                                role="link"
                                [attr.href]="item.url"
                                class="p-steps-item-link"
                                (click)="onItemClick($event, item, i)"
                                (keydown)="onItemKeydown($event, item, i)"
                                [target]="item.target"
                                [attr.tabindex]="getItemTabIndex(item, i)"
                                [attr.aria-expanded]="i === activeIndex"
                                [attr.aria-disabled]="item.disabled || (readonly && i !== activeIndex)"
                                [attr.ariaCurrentWhenActive]="exact && (!item.disabled || readonly) ? 'step' : undefined"
                            >
                                <span class="p-steps-item-number">{{ i + 1 }}</span>
                                <span class="p-steps-item-label" *ngIf="item.escape !== false; else htmlRouteLabel">{{ item.label }}</span>
                                <ng-template #htmlRouteLabel><span class="p-steps-item-label" [innerHTML]="item.label"></span></ng-template>
                            </a>
                        </ng-template>
                    </li>
                }
            </ul>
        </nav>
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation.None,
      providers: [StepsStyle]
    }]
  }], null, {
    activeIndex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    model: [{
      type: Input
    }],
    readonly: [{
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
    exact: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    activeIndexChange: [{
      type: Output
    }],
    listViewChild: [{
      type: ViewChild,
      args: ["list", {
        static: false
      }]
    }]
  });
})();
var StepsModule = class _StepsModule {
  static ɵfac = function StepsModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _StepsModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _StepsModule,
    imports: [Steps, SharedModule],
    exports: [Steps, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [Steps, SharedModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StepsModule, [{
    type: NgModule,
    args: [{
      imports: [Steps, SharedModule],
      exports: [Steps, SharedModule]
    }]
  }], null, null);
})();
export {
  Steps,
  StepsClasses,
  StepsModule,
  StepsStyle
};
//# sourceMappingURL=primeng_steps.js.map
