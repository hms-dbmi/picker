#' Create a picker proxy object
#'
#' Creates a picker-like object that can be used to update a picker object that has already been rendered.
#'
#' @param shinyId single-element character vector indicating the output ID of the
#'   deck to modify
#' @param session the \code{Shiny} session object to which the picker widget belongs;
#'   usually the default value will suffice.
#' @export
picker_proxy <- function(shinyId, session = shiny::getDefaultReactiveDomain()) {
  if (is.null(session)) {
    stop("picker_proxy must be called from the server function of a Shiny app.")
  }

  if (!is.null(session$ns) &&
      nzchar(session$ns(NULL)) &&
      substring(shinyId, 1, nchar(session$ns(""))) != session$ns("")) {
    shinyId <- session$ns(shinyId)
  }

  structure(
    list(
      session = session,
      id = shinyId
    ),
    class = c("picker_proxy", "htmlwidget_proxy")
  )
}

#' Send commands to a picker instance in a \code{Shiny} app
#'
#' @param proxy picker proxy object
#' @param view_state view state from other picker input (optional).
#' @param colors vector of colors (optional).
#' @seealso \link{picker_proxy}
#' @export
update_picker <- function(proxy, view_state = NULL, colors = NULL, label_coords = NULL, polygons = NULL, show_grid = NULL) {
  if (!inherits(proxy, "picker_proxy")) {
    stop("This function must be used with a picker_proxy object.", call. = FALSE)
  }

  proxy$session$sendCustomMessage(
    type = "proxythis",
    message = list(id = proxy$id,
                   initialViewState = view_state,
                   colors = colors,
                   labelCoords = label_coords,
                   polygons = polygons,
                   showGrid = show_grid)
  )
  proxy
}
