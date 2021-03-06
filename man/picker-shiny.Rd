% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/picker.R
\name{picker-shiny}
\alias{picker-shiny}
\alias{pickerOutput}
\alias{renderPicker}
\title{Shiny bindings for picker}
\usage{
pickerOutput(outputId, width = "100\%", height = "400px")

renderPicker(expr, env = parent.frame(), quoted = FALSE)
}
\arguments{
\item{outputId}{output variable to read from}

\item{width, height}{Must be a valid CSS unit (like \code{'100\%'},
\code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
string and have \code{'px'} appended.}

\item{expr}{An expression that generates a picker}

\item{env}{The environment in which to evaluate \code{expr}.}

\item{quoted}{Is \code{expr} a quoted expression (with \code{quote()})? This
is useful if you want to save an expression in a variable.}
}
\value{
An output or render function that enables the use of the widget
  within Shiny applications.
}
\description{
Output and render functions for using picker within Shiny
applications and interactive Rmd documents.
}
