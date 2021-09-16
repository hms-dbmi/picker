
#' Title
#'
#' @param coords data.frame with two columns. First has x, second has y coordinates.
#' @param colors vector of hex colors, one for each row of \code{coords}.
#' @param labels vector of point labels used for tooltips on hover.
#' @param label_coords data.frame with three columns 'x', 'y', and 'label'. Used for text layer.
#' @param show_controls Should control panel be shown? Default is \code{TRUE}.
#' @param scatter_props Props passed to deck.gl \href{https://deck.gl/docs/api-reference/layers/scatterplot-layer}{ScatterplotLayer}.
#' @param deck_props  Props passed to deck.gl \href{https://deck.gl/docs/api-reference/core/deck}{Deck} instance.
#' @param text_props Props passed to deck.gl \href{https://deck.gl/docs/api-reference/layers/text-layer}{TextLayer}.
#' @param width width of htmlwidget.
#' @param height height of htmlwidget.
#' @param elementId id of htmlwidget.
#'
#' @return renders html widget
#' @export
#'
picker <- function(coords, colors, labels, label_coords = NULL, show_controls = TRUE, scatter_props = NULL, deck_props = NULL, text_props = NULL, width = NULL, height = NULL, elementId = NULL) {

  colnames(coords) <- c('x', 'y')


  # forward options using x
  x = list(
    coords = coords,
    colors = colors,
    labels = labels,
    labelCoords = label_coords,
    showControls = show_controls,
    scatterPlotLayerProps = scatter_props,
    textLayerProps = text_props,
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



