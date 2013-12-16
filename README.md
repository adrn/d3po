d3po
====

d3po is a project designed to allow an astronomer (or anyone), with no special data visualization skills, to make an interactive, publication-quality figure that has staged builds and linked brushing through scatter plots. Our current version can be previewed at [d3po.org](http://d3po.org), and represents a figure from upcoming work by graduate student Elisabeth Newton. The figure describes how metalicity affects color in cool stars, and represents a nice use case for d3po. Try clicking and dragging in the scatter plots to understand the power of linked brushing in published figures.

Right now we are in search of alpha testers, who have figures that could be made interactive and who are willing to get their hands a little dirty (No javascript skills needed). In future versions, we plan to link to [glue](http://glueviz.org) to allow the creation of d3po figures interactively. We are also exploring [implementation](http://newton.cx/~peter/d3pohack/#/) of d3po within presentations and within [authorea](http://www.authorea.com). Full 1.0 version expected in January 2014.

Installing your own d3po server
-------------------------------

    git clone git@github.com:adrn/d3po.git
    cd d3po
    virtualenv --no-site-packages venv
    source venv/bin/activate
    pip install -r pip-requirements.txt
    python run.py