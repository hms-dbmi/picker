import { color as d3Color } from "d3-color";


const CLASS_NAME_CTRL = "picker-widget-ctrl";
const CLASS_NAME_CTRL_GROUP = `${CLASS_NAME_CTRL}-group`;
const POSITIONS = [
    "top-left",
    "top-right",
    "bottom-right",
    "bottom-left"
];

export const INITIAL_VIEW_STATE = {
    target: [0, 0, 0],
    minZoom: 0,
    maxZoom: 10,
    zoom: 0
};

export const convertColor = (specifier) => {
    const rgba = d3Color(specifier);
    return [ rgba.r, rgba.g, rgba.b, rgba.opacity * 255 ];
}

export const createControlPanel = (widgetElement) => {
    const ctrlPanel = document.createElement("div");
    ctrlPanel.classList.add(CLASS_NAME_CTRL_GROUP, `${CLASS_NAME_CTRL}-top-right`);
    widgetElement.appendChild(ctrlPanel);
    return ctrlPanel;
}

export const addControl = (html, parent, style) => {
    const ctrl = document.createElement("div");
    ctrl.classList.add(CLASS_NAME_CTRL);
    if (style) ctrl.style.cssText = style;

    ctrl.innerHTML = html;
    parent.appendChild(ctrl);
    return ctrl;
}

// Get the HTMLWidgets object
export const getWidget = (id) => HTMLWidgets.find("#" + id)


export const debounce = (func, wait, immediate) => {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};
