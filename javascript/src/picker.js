import { Deck, OrthographicView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer, PolygonLayer } from '@deck.gl/layers';
import { EditableGeoJsonLayer } from "@nebula.gl/layers";
import { DrawPolygonByDraggingMode, ViewMode } from "@nebula.gl/edit-modes";
import { polygon as turfPolygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import selectionLasso from './selection_lasso.svg';
import nearMe from './near_me.svg';
import layers from './layers.svg';
import "./default.css";
import { 
  createControlPanel, 
  addControl, 
  convertColor, getWidget, debounce, 
  rescaleCoords, 
  rescalePolygons, 
  polygonsToContours, 
  INITIAL_VIEW_STATE, 
  DEFAULT_CHAR_SET 
} from "./utils";


HTMLWidgets.widget({
  
  name: 'picker',
  
  type: 'output',
  
  factory: function(el, width, height) {
    
    // define shared variables for this instance
    // =========================================
    var coords, scaledCoords, xFrom, yFrom, xTo, yTo, labels,  scaledPolygons, pointColorPolygons,
    scatterPlotLayerProps, textLayerProps, deckProps, polygonLayerProps;
    
    var mar = 10;
    
    // Pass data back to R in 'shinyMode'
    const sendDataToShiny = (data, suffix) => {
      if (HTMLWidgets.shinyMode) {
        Shiny.onInputChange(el.id + suffix, data);
      }
    }
    
    // control panel click handlers
    const getCursorView = ({isDragging}) => isDragging ? 'grabbing' : 'default';
    const getCursorLasso = () => 'cell';
    
    var getFillColor = (d, { index }) => deckgl.colors[index];
    var getCursor = getCursorView;
    var mode = ViewMode;

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
    
    const toggleGrid = () => {
      grid.firstElementChild.classList.toggle('active')
      deckgl.showGrid = !deckgl.showGrid;
      
      if (deckgl.showGrid && pointColorPolygons !== null) {
        getFillColor = convertColor(pointColorPolygons);
        deckgl.colors = pointColorPolygons;
        
      } else {
        getFillColor = (d, { index }) => deckgl.colors[index];
        deckgl.colors = deckgl.origColors;
      }
      
      sendDataToShiny(deckgl.showGrid, '_show_grid');
      render()
    } 
    
    // create controls & attach listeners
    const ctrlPanel = createControlPanel(el);
    const view = addControl(`<button class="btn-picker">${nearMe}</button>`, ctrlPanel)
    const lasso = addControl(`<button class="btn-picker">${selectionLasso}</button>`, ctrlPanel)
    const grid = addControl(`<button class="btn-picker">${layers}</button>`, ctrlPanel)
    
    view.addEventListener("click", setView);
    lasso.addEventListener("click", setLasso);
    grid.addEventListener("click", toggleGrid);
    
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
    
    // add to deck object so that can update with proxy
    deckgl.grid = grid;
    deckgl.showGrid = false;
    
    // render/update function
    const render = () => {
      
      const layers = [
        new ScatterplotLayer({
          id: 'scatterplot',
          data: scaledCoords,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getPosition: d => [d.x, d.y],
          getFillColor: getFillColor,
          updateTriggers: {
            getFillColor: deckgl.colors,
            getTooltip: labels,
            getPosition: scaledCoords,
          },
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
        new PolygonLayer({
          id: 'polygons',
          data: deckgl.contours,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          pickable: false,
          stroked: true,
          filled: true,
          wireframe: true,
          visible: deckgl.showGrid,
          lineWidthMinPixels: 1,
          lineWidthMaxPixels: 0,
          getLineColor: [221, 221, 221, 255],
          getLineWidth: 1,
          getPolygon: d => d.contour,
          getFillColor: d => d.color,
          ...polygonLayerProps
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
              
              const ptsWithin = scaledCoords.reduce((out, pt, i) => 
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
          data: deckgl.scaledLabelCoords,
          getPosition: d => [d.x, d.y],
          getText: d => d.label,
          getSize: 18,
          background: true,
          getBackgroundColor: [255, 255, 255, 100],
          fontFamily: 'Helvetica, Arial, sans-serif',
          getTextAnchor: 'start',
          getAlignmentBaseline: 'top',
          getColor: [51, 51, 51],
          characterSet: DEFAULT_CHAR_SET,
          ...textLayerProps
        })
      ];
      
      
      const getTooltip = ({ index }) => index && labels[index]
      deckgl.setProps({ layers, getCursor, getTooltip, ...deckProps });
    }
    
    // what gets called from R on re-render
    const renderValue = (x) => {
      
      if (!x.showControls) {
        lasso.style.display = "none";
        view.style.display = "none";
      }
      
      // rescale x and y to width and height
      deckgl.labelCoords = HTMLWidgets.dataframeToD3(x.labelCoords);
      coords = HTMLWidgets.dataframeToD3(x.coords);
      
      xFrom = deckgl.xFrom = x.xrange;
      yFrom = deckgl.yFrom = x.yrange;
      xTo = deckgl.xTo = [-width/2 + mar, width/2 - mar];
      yTo = deckgl.yTo = [-height/2 + mar, height/2 - mar];
      
      scaledCoords = rescaleCoords(coords, xTo, yTo, xFrom, yFrom)
      deckgl.scaledLabelCoords = rescaleCoords(deckgl.labelCoords, xTo, yTo, xFrom, yFrom)
      
      pointColorPolygons = x.pointColorPolygons;
      polygonLayerProps = x.polygonLayerProps;
      
      if (x.polygons !== null) {
        x.polygons.color = x.polygons.color.map((hex) => convertColor(hex));
        deckgl.polygons = HTMLWidgets.dataframeToD3(x.polygons);
        scaledPolygons = rescalePolygons(deckgl.polygons, xTo, yTo, xFrom, yFrom);
        deckgl.contours = polygonsToContours(scaledPolygons);
        
      } else {
        if (deckgl.showGrid) deckgl.grid.click();
        deckgl.grid.style.display = "none";
      }
      
      deckgl.colors = deckgl.origColors = x.colors.map((color) => convertColor(color));
      deckgl.render = render;
      
      labels = x.labels;
      scatterPlotLayerProps = x.scatterPlotLayerProps;
      textLayerProps = x.textLayerProps;
      deckProps = x.deckProps;
      
      render()
    }
    
    // a method to expose our deck to the outside
    const getDeck = () => deckgl;
    
    // handlers to update via proxy
    // NOTE: updates/calls in here must reference correct deck instance
    if (HTMLWidgets.shinyMode) {
      Shiny.addCustomMessageHandler('proxythis', function(obj) {
        
        // get correct HTMLWidget deck instance
        const deck = getWidget(obj.id).getDeck();
        
        // destructure deck attributes
        const { xTo, yTo, xFrom, yFrom } = deck;
        
        // update viewState
        if (obj.initialViewState !== null) {
          deck.setProps({ initialViewState: {...INITIAL_VIEW_STATE, ...obj.initialViewState} });
        }
        
        if (obj.colors !== null) {
          deck.colors = obj.colors.map((color) => convertColor(color));
          deck.render();
        } 
        
        if (obj.labelCoords !== null) {
          deck.labelCoords = HTMLWidgets.dataframeToD3(obj.labelCoords);
          deck.scaledLabelCoords = rescaleCoords(deck.labelCoords, xTo, yTo, xFrom, yFrom);
          deck.render();
        } 
        
        if (obj.polygons !== null) {
          obj.polygons.color = obj.polygons.color.map((hex) => convertColor(hex));
          deck.polygons = HTMLWidgets.dataframeToD3(obj.polygons);
          const scaledPolygons = rescalePolygons(deck.polygons, xTo, yTo, xFrom, yFrom);
          deck.contours = polygonsToContours(scaledPolygons);
          deck.grid.style.display = "block";
          
          deck.render();
        }

        if (obj.showGrid && !deck.showGrid) {
          deck.grid.click();
        }
        
      });
    }
    
    const resize = (width, height) => {
      
      // rescale x and y to width and height and re-render
      xTo = deckgl.xTo = [-width/2 + mar, width/2 - mar];
      yTo = deckgl.yTo = [-height/2 + mar, height/2 - mar];
      
      const { xFrom, yFrom } = deckgl;
      
      scaledCoords = rescaleCoords(coords, xTo, yTo, xFrom, yFrom);
      deckgl.scaledLabelCoords = rescaleCoords(deckgl.labelCoords, xTo, yTo, xFrom, yFrom);
      
      if (deckgl.polygons !== undefined) {
        scaledPolygons = rescalePolygons(deckgl.polygons, xTo, yTo, xFrom, yFrom);
        deckgl.contours = polygonsToContours(scaledPolygons);
      }
      
      render()
    }
    
    return {renderValue, resize: debounce(resize, 50), getDeck};
  }
});