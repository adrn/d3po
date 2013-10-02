d3po
====

d3po is a project designed to allow an astronomer (or anyone), with no special data visualization skills, to make an interactive, publication-quality figure that has staged builds and linked brushing through scatter plots. Our current version can be previewed at d3po.org, and represents a figure from upcoming work by graduate student Elisabeth Newton. The figure describes how metalicity affects color in cool stars, and represents a nice use case for d3po. Try clicking and dragging in the scatter plots to understand the power of linked brushing in published figures.

Right now we are in search of alpha testers, who have figures that could be made interactive and who are willing to get their hands a little dirty (No javascript skills needed). In future versions, we plan to link to glueviz.org to allow the creation of d3po figures interactively. We are also exploring implementation of d3po within presentations (see http://newton.cx/~peter/d3pohack/#/) and withing Authorea.com. Full 1.0 version expected in January 2014.

dev
---
If you're interested in checking out the code and running it yourself, the easiest way is to:

1. clone this repository,
2. change your current directory to the cloned repository,
3. start a simple web server with Python: `python -m SimpleHTTPServer`,
4. point your browser to `http://0.0.0.0:8000`.
