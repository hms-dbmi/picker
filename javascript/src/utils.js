import { color as d3Color } from "d3-color";


const CLASS_NAME_CTRL = "picker-widget-ctrl";
const CLASS_NAME_CTRL_GROUP = `${CLASS_NAME_CTRL}-group`;
const POSITIONS = [
    "top-left",
    "top-right",
    "bottom-right",
    "bottom-left"
];

function getDefaultCharacterSet() {
    const charSet = ['Δ'];
    for (let i = 32; i < 128; i++) {
        charSet.push(String.fromCharCode(i));
    }
    return charSet;
}

export const DEFAULT_CHAR_SET = getDefaultCharacterSet();

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
    ctrlPanel.classList.add(CLASS_NAME_CTRL_GROUP, `${CLASS_NAME_CTRL}-top-right`, 'no-pointer');
    widgetElement.appendChild(ctrlPanel);
    return ctrlPanel;
}

export function createLegendPanel(widgetElement) {
    const legendPanel = document.createElement("div");

    legendPanel.classList.add(CLASS_NAME_CTRL_GROUP, `${CLASS_NAME_CTRL}-bottom-right`);
    widgetElement.appendChild(legendPanel);
    return legendPanel;
}
// legendPanel.innerHTML = html;


export function getGridLegendHTML(items, title) {
    var html = '';

    if (items) {
        const rows = items.map(item => `
        <li>
        <span class="point-mark" style="background:${item.color};border: 1px solid black;"></span>
        <span>${item.label}</span>
        </li>
        `);
        html = `
        <div class="legend">
        <div class="legend-title">${title || "" }</div>
        <div class="legend-items"><ul>${rows.join("\n")}</ul></div>
        </div>
        `;
    }

    return html;
}

export function getScaleLegendHTML(props) {
    var html = '';

    if (props) {
        html = `
        <div class="legend scale">
            <div class="gradient" style="background-image: linear-gradient(${props.colorHigh}, ${props.colorLow});"></div>
            <div class="range">
                <div>${props.high}</div>
                <div>${props.low}</div>
            </div>
        </div>
        `;
    }

    return html;
}

export function createTitlePanel(widgetElement, title) {
    var html = '';
    if (title) html = title;

    const titlePanel = document.createElement("div");
    titlePanel.innerHTML = html;

    titlePanel.classList.add(CLASS_NAME_CTRL_GROUP, `${CLASS_NAME_CTRL}-top-left`, 'title');
    widgetElement.appendChild(titlePanel);
    return titlePanel;
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

export const rescaleCoords = (coords, xTo, yTo, xFrom, yFrom) => {

    // pre-calc scale factors
    var xScale = (xTo[1] - xTo[0]) / (xFrom[1] - xFrom[0]);
    var yScale = (yTo[1] - yTo[0]) / (yFrom[1] - yFrom[0]);

    // need non-shallow copy for deck.gl dataComparator
    var scaledCoords = coords.map((coord) => ({
        ...coord,
        x: xScale * (coord.x - xFrom[0]) + xTo[0],
        y: yScale * (coord.y - yFrom[0]) + yTo[0]
    }))

    return scaledCoords;
}

export const rescalePolygons = (polygons, xTo, yTo, xFrom, yFrom) => {

    // pre-calc scale factors
    var xScale = (xTo[1] - xTo[0]) / (xFrom[1] - xFrom[0]);
    var yScale = (yTo[1] - yTo[0]) / (yFrom[1] - yFrom[0]);

    // need non-shallow copy for deck.gl dataComparator
    var scaledPolygons = polygons.map((poly) => ({
        ...poly,
        x1: xScale * (poly.x1 - xFrom[0]) + xTo[0],
        x2: xScale * (poly.x2 - xFrom[0]) + xTo[0],
        y1: yScale * (poly.y1 - yFrom[0]) + yTo[0],
        y2: yScale * (poly.y2 - yFrom[0]) + yTo[0]
    }))

    return scaledPolygons;
}


export const polygonsToContours = (polygons) => {

    const contours = polygons.map((poly) => ({
        ...poly,
        contour: [
            [poly.x1, poly.y1],
            [poly.x1, poly.y2],
            [poly.x2, poly.y2],
            [poly.x2, poly.y1]
        ]
    }))

    return contours;

}
