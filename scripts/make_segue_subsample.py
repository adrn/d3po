from astropy.io import fits, ascii
from astropy.table import Table
import numpy as np

sspp = fits.open("/Users/adrian/projects/segue-learn/data/ssppOut-dr9.fits")
all_data = sspp[1].data

best_data = all_data[all_data['FLAG'] == 'nnnnn']
best_data = best_data[(best_data['RV_ADOP'] != -9999) & \
                      (best_data['FEH_ADOP'] != -9999) & \
                      (best_data['DIST_AP'] != -9999)]

idx = np.random.randint(len(best_data), size=5000)
subsample = best_data[idx]

d = Table(best_data)['RA', 'DEC', 'L', 'B', 'RV_ADOP', 'TEFF_ADOP', 'LOGG_ADOP', 'FEH_ADOP']

ascii.write(d, "segue_sample.csv", delimiter=",")
