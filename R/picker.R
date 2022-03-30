
#' Render a Picker Widget
#'
#' @param coords data.frame with two columns. First has x, second has y coordinates.
#' @param colors vector of hex colors, one for each row of \code{coords}.
#' @param labels vector of point labels used for tooltips on hover.
#' @param title character string to show in top left of plot.
#' @param label_coords data.frame with three columns 'x', 'y', and 'label'. Used for text layer.
#' @param polygons data.frame containing at minimum columns 'x1', 'x2', 'y1', 'y2',
#'    that define the polygons to draw and 'color' that defines the color.
#' @param point_color_polygons character, a color to make points when polygons are shown e.g. \code{'white'}.
#' @param show_controls Should control panel be shown? Default is \code{TRUE}.
#' @param grid_legend_items list of lists with \code{color} hex for legend
#'   square and \code{label} for legend items. Only visible for grid display.
#' @param scale_legend_props optional props to render a gradient scale legend.
#'   For example: \code{list(colorHigh = 'red', colorLow = 'gray', high = 4, low = 0)}
#' @param scatter_props Props passed to deck.gl \href{https://deck.gl/docs/api-reference/layers/scatterplot-layer/}{ScatterplotLayer}.
#' @param deck_props  Props passed to deck.gl \href{https://deck.gl/docs/api-reference/core/deck/}{Deck} instance.
#' @param text_props Props passed to deck.gl \href{https://deck.gl/docs/api-reference/layers/text-layer/}{TextLayer}.
#' @param polygon_props Props passed to deck.gl \href{https://deck.gl/docs/api-reference/layers/polygon-layer/}{PolygonLayer}.
#' @param xrange range of x-values. Default is \code{range(coords[,1])}.
#' @param yrange range of y-values. Default is \code{range(coords[,2])}.
#' @param xaxs the fraction to extend \code{xrange} on either side. Default is 0.04.
#' @param yaxs the fraction to extend \code{yrange} on either side. Default is 0.04.
#' @param width width of htmlwidget.
#' @param height height of htmlwidget.
#' @param elementId id of htmlwidget.
#' @encoding UTF-8
#'
#' @return renders html widget
#' @export
#'
#' @examples
#'
#' if (interactive()) {
#'   library(shiny)
#'   library(picker)
#'
#'   # load example data
#'   load(system.file('extdata/pbmcs.rda', package = 'picker'))
#'
#'   # setup gradient scale legend
#'   scale_legend_props <- list(
#'     colorHigh = 'blue',
#'     colorLow = '#f5f5f5',
#'     high = round(max(exp)),
#'     low = min(exp))
#'
#'   text_props <- list()
#'
#'   # get colors for gene expression
#'   exp <- scales::rescale(exp, c(0, 1))
#'   expression_colors <- scales::seq_gradient_pal('#f5f5f5', 'blue')(exp)
#'
#'   # legend to show when grid is visible
#'   grid_legend_items = list(
#'     list(color = '#FF0000', label = '\U2191'),
#'     list(color = '#0000FF', label = '\U2193'),
#'     list(color = '#989898', label = 'p \U003C .05'),
#'     list(color = '#EAEAEA', label = 'p \U2265 .05')
#'   )
#'
#'   ui = shinyUI(fluidPage(
#'     tags$head(tags$style(".picker {border: 1px solid #ddd; margin: 20px 0;}")),
#'     shiny::column(
#'       width = 6,
#'       pickerOutput('clusters', width = '100%', height = '400px'),
#'       pickerOutput('expression', width = '100%', height = '400px'),
#'       verbatimTextOutput('selected')
#'     )
#'   ))
#'
#'   server = function(input, output) {
#'
#'     # show selected output
#'     output$selected <- renderPrint({
#'       input$clusters_selected_points
#'     })
#'
#'     # coordinate views (zoom/pan)
#'     clusters_proxy <- picker_proxy('clusters')
#'     observeEvent(input$expression_view_state, {
#'       update_picker(clusters_proxy, input$expression_view_state)
#'     })
#'
#'     expression_proxy <- picker_proxy('expression')
#'     observeEvent(input$clusters_view_state, {
#'       update_picker(expression_proxy, input$clusters_view_state)
#'     })
#'
#'     # change title between grid/scatterplot
#'     observeEvent(input$clusters_show_grid, {
#'       title <- ifelse(input$clusters_show_grid, '\U0394 CELLS', '')
#'       update_picker(clusters_proxy, title = title)
#'     })
#'
#'
#'     # render pickers
#'     output$clusters <- renderPicker(
#'       picker(
#'         coords,
#'         cluster_colors,
#'         labels,
#'         label_coords = label_coords,
#'         polygons = polygons,
#'         text_props = text_props,
#'         point_color_polygons = 'white',
#'         grid_legend_items = grid_legend_items)
#'     )
#'
#'     output$expression <- renderPicker(
#'       picker(coords,
#'              expression_colors,
#'              labels,
#'              show_controls = FALSE,
#'              scale_legend_props = scale_legend_props)
#'     )
#'   }
#'
#'   shinyApp(ui = ui, server = server, options = list(launch.browser = TRUE))
#' }

picker <- function(coords, colors, labels, title = NULL, label_coords = NULL, polygons = NULL, point_color_polygons = NULL, show_controls = TRUE, grid_legend_items = NULL, scale_legend_props = NULL, scatter_props = NULL, deck_props = NULL, text_props = NULL, polygon_props = NULL, xrange = NULL, yrange = NULL, xaxs = 0.04, yaxs = 0.04,  width = NULL, height = NULL, elementId = NULL) {

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
    title = title,
    labelCoords = label_coords,
    polygons = polygons,
    pointColorPolygons = point_color_polygons,
    showControls = show_controls,
    gridLegendItems = grid_legend_items,
    scaleLegendProps = scale_legend_props,
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
#' @inherit htmlwidgets::shinyWidgetOutput return
#' @name picker-shiny
#'
#' @export
pickerOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'picker', width, height, package = 'picker')
}

#' @rdname picker-shiny
#' @inherit htmlwidgets::shinyRenderWidget return
#' @export
renderPicker <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, pickerOutput, env, quoted = TRUE)
}

