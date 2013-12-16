# coding: utf-8
#-----------------------------------------------------------------------------
#  Copyright (C) 2013 D3PO
#
#  Distributed under the terms of the BSD License.  The full license is in
#  the file LICENSE.txt, distributed as part of this software.
#-----------------------------------------------------------------------------

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
    parser.add_argument("--extern", action="store_true", dest="extern",
                        default=False, help="Run on an external server")

    args = parser.parse_args()

    if args.extern:
        host = "0.0.0.0"
    else:
        host = "127.0.0.1"
    app.run(host=host, debug=args.debug)
