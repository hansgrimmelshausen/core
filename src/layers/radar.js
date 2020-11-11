/* eslint-disable no-param-reassign */
import { Raster as RasterSource, XYZ } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { transformExtent } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import ImageLayer from 'ol/layer/Image';
import { tileBaseUrl } from './urls';
import { dwdAttribution } from './attributions';
import { dwdExtentInv } from './extents';
import { meteocoolClassic, viridis } from '../colormaps';
import {DEVICE_PIXEL_RATIO} from "ol/has";

let cmap = viridis;

// eslint-disable-next-line import/prefer-default-export
export const dwdLayer = (tileId, bucket = 'meteoradar') => {
  const reflectivitySource = new XYZ({
    url: `${tileBaseUrl}/${bucket}/${tileId}/{z}/{x}/{-y}.png`,
    attributions: [dwdAttribution],
    crossOrigin: 'anonymous',
    minZoom: 1,
    maxZoom: 8,
    transition: 0,
    tilePixelRatio: DEVICE_PIXEL_RATIO > 1 ? 2 : 1, // Retina support
    tileSize: 512,
  });
  const reflectivityLayer = new TileLayer({
    source: reflectivitySource,
    zIndex: 1000,
  });

  // Disable browser upsampling
  reflectivityLayer.on('prerender', (evt) => {
    evt.context.imageSmoothingEnabled = false;
    evt.context.msImageSmoothingEnabled = false;
  });

  const rasterRadar = new RasterSource({
    sources: [reflectivityLayer],
    // XXX eslint converts the following to a syntax error. good job y'all
    // eslint-disable-next-line object-shorthand
    operation: function (pixels, data) {
      let dbz = pixels[0][0];
      if (dbz >= data.cmapLength) {
        dbz = data.cmapLength - 1;
      }
      pixels[0][0] = data.cmap[dbz][0];
      pixels[0][1] = data.cmap[dbz][1];
      pixels[0][2] = data.cmap[dbz][2];
      pixels[0][3] = data.cmap[dbz][3];
      return pixels[0];
    },
  });
  rasterRadar.on('beforeoperations', (event) => {
    event.data.cmap = cmap;
    event.data.cmapLength = cmap.length;
  });

  const rasterRadarImageLayer = new ImageLayer({
    zIndex: 3,
    source: rasterRadar,
    title: 'Radar Composite',
    id: tileId,
  });
  rasterRadarImageLayer.setExtent(transformExtent([2.8125, 45, 19.6875, 56.25], 'EPSG:4326', 'EPSG:3857'));

  // XXX
  window.updateColormap = (colorMapString) => {
    if (colorMapString === 'classic') {
      cmap = meteocoolClassic;
    } else {
      cmap = viridis;
    }
    rasterRadar.changed();
    return true;
  };

  return [rasterRadarImageLayer, reflectivitySource];
};

export const greyOverlay = () => new VectorLayer({
  zIndex: 1000,
  source: new VectorSource({
    features: [new Feature({
      geometry: dwdExtentInv,
      name: 'DarkOverlay',
    })],
  }),
  style: new Style({
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.1)',
    }),
  }),
});
