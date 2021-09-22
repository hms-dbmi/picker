
#' Render a Picker Widget
#'
#' @param coords data.frame with two columns. First has x, second has y coordinates.
#' @param colors vector of hex colors, one for each row of \code{coords}.
#' @param labels vector of point labels used for tooltips on hover.
#' @param label_coords data.frame with three columns 'x', 'y', and 'label'. Used for text layer.
#' @param polygons data.frame containing at minimum columns 'x1', 'x2', 'y1', 'y2',
#'    that define the polygons to draw and 'color' that defines the color.
#' @param point_color_polygons character, a color to make points when polygons are shown e.g. \code{'white'}.
#' @param show_controls Should control panel be shown? Default is \code{TRUE}.
#' @param scatter_props Props passed to deck.gl \href{https://deck.gl/docs/api-reference/layers/scatterplot-layer}{ScatterplotLayer}.
#' @param deck_props  Props passed to deck.gl \href{https://deck.gl/docs/api-reference/core/deck}{Deck} instance.
#' @param text_props Props passed to deck.gl \href{https://deck.gl/docs/api-reference/layers/text-layer}{TextLayer}.
#' @param polygon_props Props passed to deck.gl \href{https://deck.gl/docs/api-reference/layers/polygon-layer}{PolygonLayer}.
#' @param xrange range of x-values. Default is \code{range(coords[,1])}.
#' @param yrange range of y-values. Default is \code{range(coords[,2])}.
#' @param xaxs the fraction to extend \code{xrange} on either side. Default is 0.04.
#' @param yaxs the fraction to extend \code{yrange} on either side. Default is 0.04.
#' @param width width of htmlwidget.
#' @param height height of htmlwidget.
#' @param elementId id of htmlwidget.
#'
#' @return renders html widget
#' @export
#'
picker <- function(coords, colors, labels, label_coords = NULL, polygons = NULL, point_color_polygons = NULL, show_controls = TRUE, scatter_props = NULL, deck_props = NULL, text_props = NULL, polygon_props = NULL, xrange = NULL, yrange = NULL, xaxs = 0.04, yaxs = 0.04,  width = NULL, height = NULL, elementId = NULL) {

  colnames(coords) <- c('x', 'y')

  if (is.null(xrange)) xrange <- range(coords$x)
  if (is.null(yrange)) yrange <- range(coords$y)

  # extend ranges
  xext <- diff(xrange)*xaxs
  yext <- diff(yrange)*yaxs

  xrange <- xrange + c(-xext, xext)
  yrange <- yrange + c(-yext, yext)

  # forward options using x
  x = list(
    coords = coords,
    xrange = xrange,
    yrange = yrange,
    colors = colors,
    labels = labels,
    labelCoords = label_coords,
    polygons = polygons,
    pointColorPolygons = point_color_polygons,
    showControls = show_controls,
    scatterPlotLayerProps = scatter_props,
    textLayerProps = text_props,
    polygonLayerProps = polygon_props,
    deckProps = deck_props
    )

  # create widget
  htmlwidgets::createWidget(
    name = 'picker',
    x,
    width = width,
    height = height,
    package = 'picker',
    elementId = elementId
  )
}

#' Shiny bindings for picker
#'
#' Output and render functions for using picker within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a picker
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name picker-shiny
#'
#' @export
pickerOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'picker', width, height, package = 'picker')
}

#' @rdname picker-shiny
#' @export
renderPicker <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, pickerOutput, env, quoted = TRUE)
}



