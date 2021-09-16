import { Deck, OrthographicView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { EditableGeoJsonLayer } from "@nebula.gl/layers";
import { DrawPolygonByDraggingMode, ViewMode } from "@nebula.gl/edit-modes";
import { polygon as turfPolygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { createControlPanel, addControl, convertColor, getWidget, debounce, INITIAL_VIEW_STATE } from "./utils";
import selectionLasso from './selection_lasso.svg';
import nearMe from './near_me.svg';
import "./default.css";

const getCoordsRange = (coords) => {

  var xMin, yMin, xMax, yMax, xTmp, yTmp;
  xMin = yMin = Number.POSITIVE_INFINITY;
  xMax = yMax = Number.NEGATIVE_INFINITY;

  for (var i=coords.length-1; i >= 0; i--) {
      // update x min/max
      xTmp = coords[i].x;
      if (xTmp < xMin) xMin = xTmp;
      if (xTmp > xMax) xMax = xTmp;
      
      // update ymin/max
      yTmp = coords[i].y;
      if (yTmp < yMin) yMin = yTmp;
      if (yTmp > yMax) yMax = yTmp;
  }

  return {xFrom: [xMin, xMax], yFrom: [yMin, yMax]};
}


const rescaleCoords = (coords, xTo, yTo, xFrom, yFrom) => {
  
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


HTMLWidgets.widget({
  
  name: 'picker',
  
  type: 'output',
  
  factory: function(el, width, height) {
    
    // define shared variables for this instance
    // =========================================

    var coords, xFrom, yFrom, colors, labels, labelCoords, scatterPlotLayerProps, textLayerProps, deckProps;
    var mar = 10;
    
    const getCursorView = ({isDragging}) => isDragging ? 'grabbing' : 'default';
    const getCursorLasso = () => 'cell';
    
    var mode = ViewMode
    var getCursor = getCursorView
    
    const sendDataToShiny = (data, suffix) => {
      // Pass data back to R in 'shinyMode'
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange(el.id + suffix, data);
      }
    }
    
    // setup controls
    const setView = () => {
      view.firstElementChild.classList.add('active')
      lasso.firstElementChild.classList.remove('active')
      mode = ViewMode
      getCursor = getCursorView
      render()
    }
    const setLasso = () => {
      lasso.firstElementChild.classList.add('active')
      view.firstElementChild.classList.remove('active')
      mode = DrawPolygonByDraggingMode
      getCursor = getCursorLasso
      render()
    } 
    
    const ctrlPanel = createControlPanel(el);
    const view = addControl(`<button class="btn-picker">${nearMe}</button>`, ctrlPanel)
    const lasso = addControl(`<button class="btn-picker">${selectionLasso}</button>`, ctrlPanel)
    
    view.addEventListener("click", setView);
    lasso.addEventListener("click", setLasso);

    // initial tool selection
    view.firstElementChild.classList.add('active');
    
    var myFeatureCollection = {
      type: "FeatureCollection",
      features: []
    };
    
    // the deck instance
    const deckgl = new Deck({
      initialViewState: INITIAL_VIEW_STATE,
      parent: el,
      views: new OrthographicView({flipY: false}),
      controller: true,
      useDevicePixels: 2,
      onViewStateChange: ({ viewState }) => {
        //  if zoomed out, reset view
        var {zoom, target} = viewState;
        if (zoom === 0) target = [0, 0]
        viewState.target = target
        
        // send to Shiny for coordinated zooming across plots
        sendDataToShiny({ zoom, target }, '_view_state');

        return viewState;
      }
    });
    
    // render/update function
    const render = () => {

      const layers = [
        new ScatterplotLayer({
          data: coords,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getPosition: d => [d.x, d.y],
          getFillColor: (d, { index }) => colors[index],
          updateTriggers: {
            getFillColor: colors,
            getTooltip: labels,
            getPosition: coords,
          },
          getLineColor: [0, 0, 0],
          getPointRadius: 1,
          pickable: true,
          opacity: 0.8,
          stroked: true,
          filled: true,
          radiusScale: 1,
          getLineColor: [51, 51, 51, 100],
          radiusMinPixels: 3,
          radiusMaxPixels: 20,
          lineWidthMinPixels: 1,
          lineWidthMaxPixels: 0,
          ...scatterPlotLayerProps
        }),
        new EditableGeoJsonLayer({
          id: "nebula",
          data: myFeatureCollection,
          selectedFeatureIndexes: [],
          mode: mode,
          onEdit: ({ updatedData, editType }) => {
            if (editType === "addFeature") {
              const { coordinates } = updatedData.features[0].geometry;
              const polygon = turfPolygon(coordinates);
              
              const ptsWithin = coords.reduce((out, pt, i) => 
              booleanPointInPolygon([pt.x, pt.y], polygon) ? out.concat(i) : out,
              []);
              
              sendDataToShiny(ptsWithin, "_selected_points")
            }
            return;
          },
          // Styles
          filled: true,
          pointRadiusMinPixels: 2,
          pointRadiusScale: 2000,
          extruded: true,
          getElevation: 1000,
          getFillColor: [200, 0, 80, 180],
          _subLayerProps: {
            guides: {
              pointRadiusMinPixels: 2,
              pointRadiusMaxPixels: 2,
            }
          },
          // Interactive props
          pickable: true,
          autoHighlight: true,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
        }),
        new TextLayer({
          data: labelCoords,
          getPosition: d => [d.x, d.y],
          getText: d => d.label,
          getSize: 18,
          background: true,
          getBackgroundColor: [255, 255, 255, 100],
          fontFamily: 'Helvetica, Arial, sans-serif',
          getTextAnchor: 'start',
          getAlignmentBaseline: 'top',
          ...textLayerProps
        })
      ];

      
      const getTooltip = ({ index }) => index && labels[index]
      deckgl.setProps({ layers, getCursor, getTooltip, ...deckProps });
    }
    
    const renderValue = (x) => {

      ctrlPanel.style.display = x.showControls ? "block" : "none";
      
      // rescale x and y to width and height
      labelCoords = HTMLWidgets.dataframeToD3(x.labelCoords);
      coords = HTMLWidgets.dataframeToD3(x.coords);

      ({ xFrom, yFrom } = getCoordsRange(coords));
      var xTo = [-width/2 + mar, width/2 - mar];
      var yTo = [-height/2 + mar, height/2 - mar];
      coords = rescaleCoords(coords, xTo, yTo, xFrom, yFrom)
      labelCoords = rescaleCoords(labelCoords, xTo, yTo, xFrom, yFrom)

      // allow updates to colors and labels without changing data
      // see https://deck.gl/docs/developer-guide/performance#use-updatetriggers
      colors = x.colors.map((color) => convertColor(color));
      labels = x.labels;
      scatterPlotLayerProps = x.scatterPlotLayerProps;
      textLayerProps = x.textLayerProps;
      deckProps = x.deckProps;
      
      render()
    }

    // a method to expose our deck to the outside
    const getDeck = () => deckgl;

    if (HTMLWidgets.shinyMode) {
      Shiny.addCustomMessageHandler('proxythis', function({id, initialViewState }) {

        // get correct HTMLWidget deck instance
        const deck = getWidget(id).getDeck();

        // update viewState
        deck.setProps({ initialViewState: { ...INITIAL_VIEW_STATE, ...initialViewState } });
      });
    }
    
    const resize = (width, height) => {

      // rescale x and y to width and height and re-render
      ({ xFrom, yFrom } = getCoordsRange(coords));
      var xTo = [-width/2 + mar, width/2 - mar];
      var yTo = [-height/2 + mar, height/2 - mar];
      
      coords = rescaleCoords(coords, xTo, yTo, xFrom, yFrom);
      labelCoords = rescaleCoords(labelCoords, xTo, yTo, xFrom, yFrom);

      render()
    }
    
    return {renderValue, resize: debounce(resize, 50), getDeck};
  }
});