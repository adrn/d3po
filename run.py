# coding: utf-8

from __future__ import division, print_function

__author__ = "adrn <adrn@astro.columbia.edu>"

# Standard library
import os, sys

# Project
from d3po import app

if __name__ == "__main__":
    from argparse import ArgumentParser

    # Define parser object
    parser = ArgumentParser(description="")
    # parser.add_argument("-v", "--verbose", action="store_true", dest="verbose",
    #                     default=False, help="Be chatty! (default = False)")
    # parser.add_argument("-q", "--quiet", action="store_true", dest="quiet",
    #                     default=False, help="Be quiet! (default = False)")
    parser.add_argument("--debug", action="store_true", dest="debug",
                        default=False, help="Run flask with debugging.")

    args = parser.parse_args()

    app.run(debug=args.debug)