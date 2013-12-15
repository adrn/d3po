# coding: utf-8

from __future__ import division, print_function

__author__ = "adrn <adrn@astro.columbia.edu>"

# Standard library

# Third-party
from flask import render_template

# Project
from . import app

@app.route('/')
def index():
    return render_template('index.html')