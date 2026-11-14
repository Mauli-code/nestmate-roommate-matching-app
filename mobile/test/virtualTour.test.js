import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_PROPERTIES,
  getPropertyById,
  getPropertyVirtualTour,
} from '../src/data/mockData.js';
import { generatePanoramaHtml } from '../src/utils/panoramaHtml.js';

test('VR Virtual Tour - Data Model & Schema Integrity', async (t) => {
  await t.test('getPropertyById finds valid properties and returns null for invalid IDs', () => {
    const prop1 = getPropertyById('prop-1');
    assert.ok(prop1, 'prop-1 should be found');
    assert.equal(prop1.id, 'prop-1');

    const unknown = getPropertyById('non-existent-prop');
    assert.equal(unknown, null);

    const empty = getPropertyById('');
    assert.equal(empty, null);
  });

  await t.test('getPropertyVirtualTour returns tour object for supported accommodations', () => {
    const tour1 = getPropertyVirtualTour('prop-1');
    assert.ok(tour1, 'prop-1 should have a virtual tour');
    assert.equal(tour1.enabled, true);
    assert.ok(Array.isArray(tour1.scenes));
    assert.ok(tour1.scenes.length >= 2, 'prop-1 should have at least 2 scenes');

    const tour2 = getPropertyVirtualTour('prop-2');
    assert.ok(tour2, 'prop-2 should have a virtual tour');
    assert.equal(tour2.scenes.length, 4, 'prop-2 has 4 rooms');
  });

  await t.test('getPropertyVirtualTour returns null for properties without a virtual tour', () => {
    const tour3 = getPropertyVirtualTour('prop-3');
    assert.equal(tour3, null, 'prop-3 should not have a virtual tour');

    const tour5 = getPropertyVirtualTour('prop-5');
    assert.equal(tour5, null, 'prop-5 should not have a virtual tour');

    const tourInvalid = getPropertyVirtualTour('non-existent');
    assert.equal(tourInvalid, null);
  });

  await t.test('Every scene in supported tours conforms to the 360 scene schema', () => {
    const propertiesWithTour = MOCK_PROPERTIES.filter(p => p.virtualTour && p.virtualTour.enabled);
    assert.ok(propertiesWithTour.length >= 3, 'At least 3 properties should have VR tours enabled');

    propertiesWithTour.forEach(p => {
      const tour = p.virtualTour;
      assert.ok(tour.title, `Tour for ${p.id} must have a title`);
      assert.ok(tour.defaultSceneId, `Tour for ${p.id} must have a defaultSceneId`);

      const defaultScene = tour.scenes.find(s => s.id === tour.defaultSceneId);
      assert.ok(defaultScene, `defaultSceneId "${tour.defaultSceneId}" must match an existing scene in ${p.id}`);

      tour.scenes.forEach(scene => {
        assert.ok(scene.id, 'Scene must have an id');
        assert.ok(scene.name, 'Scene must have a name');
        assert.ok(scene.icon, 'Scene must have an icon');
        assert.ok(scene.description, 'Scene must have a description');
        assert.ok(typeof scene.panoramaUrl === 'string' && scene.panoramaUrl.length > 0, 'Scene must have a valid panoramaUrl string');
        assert.ok(typeof scene.initialYaw === 'number', 'initialYaw must be a number');
        assert.ok(typeof scene.initialPitch === 'number', 'initialPitch must be a number');
        assert.ok(scene.initialPitch >= -90 && scene.initialPitch <= 90, 'initialPitch must be within [-90, +90]');
        assert.ok(typeof scene.initialFov === 'number', 'initialFov must be a number');
        assert.ok(scene.initialFov >= 30 && scene.initialFov <= 100, 'initialFov must be within reasonable range [30, 100]');
      });
    });
  });
});

test('VR Virtual Tour - Scene Switching & Multi-Room Logic', async (t) => {
  await t.test('Property 2 has multi-room coverage including living room, master suite, kitchen, and balcony', () => {
    const tour = getPropertyVirtualTour('prop-2');
    const sceneIds = tour.scenes.map(s => s.id);
    assert.ok(sceneIds.includes('living-room'));
    assert.ok(sceneIds.includes('master-bedroom'));
    assert.ok(sceneIds.includes('kitchen'));
    assert.ok(sceneIds.includes('balcony'));
  });

  await t.test('Scene switcher resolves default scene and arbitrary scene switching', () => {
    const tour = getPropertyVirtualTour('prop-1');
    const initialScene = tour.scenes.find(s => s.id === tour.defaultSceneId);
    assert.equal(initialScene.id, 'living-room');

    const bedroomScene = tour.scenes.find(s => s.id === 'bedroom');
    assert.ok(bedroomScene);
    assert.equal(bedroomScene.name, 'Bedroom');
    assert.equal(bedroomScene.initialYaw, 45);
  });
});

test('VR Virtual Tour - HTML5 WebGL Generator & Fallback Engine', async (t) => {
  await t.test('generatePanoramaHtml returns complete valid WebGL HTML document', () => {
    const tour = getPropertyVirtualTour('prop-1');
    const html = generatePanoramaHtml({
      scene: tour.scenes[0],
      scenes: tour.scenes,
      propertyTitle: 'Koramangala 1BHK',
      autoRotate: false,
    });

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('<canvas id="glcanvas">'));
    assert.ok(html.includes('gl.createShader'));
    assert.ok(html.includes('uTexture'));
    assert.ok(html.includes('uYaw'));
    assert.ok(html.includes('uPitch'));
    assert.ok(html.includes('uFov'));
    assert.ok(html.includes('atan(r2.x, r2.z)'), 'Fragment shader computes equirectangular longitude');
    assert.ok(html.includes('asin(clamp(r2.y'), 'Fragment shader computes equirectangular latitude');
    assert.ok(html.includes('createProceduralPanorama'), 'Includes procedural offline fallback generator');
    assert.ok(html.includes('ReactNativeWebView'), 'Includes bidirectional postMessage bridge');
  });

  await t.test('generatePanoramaHtml handles empty or undefined scene safely', () => {
    const html = generatePanoramaHtml({});
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('glcanvas'));
  });

  await t.test('generatePanoramaHtml configures auto-rotation flag accurately', () => {
    const htmlAuto = generatePanoramaHtml({ autoRotate: true });
    assert.ok(htmlAuto.includes('var autoRotate = true;'));

    const htmlManual = generatePanoramaHtml({ autoRotate: false });
    assert.ok(htmlManual.includes('var autoRotate = false;'));
  });
});

test('VR Virtual Tour - UI Badge and Availability Indicators', async (t) => {
  await t.test('Checks virtual tour presence flag for property cards and details', () => {
    const propWithTour = MOCK_PROPERTIES.find(p => p.id === 'prop-1');
    const hasTourBadge = Boolean(propWithTour?.virtualTour?.enabled);
    assert.equal(hasTourBadge, true, 'prop-1 should show 360° tour badge');

    const propWithoutTour = MOCK_PROPERTIES.find(p => p.id === 'prop-3');
    const noTourBadge = Boolean(propWithoutTour?.virtualTour?.enabled);
    assert.equal(noTourBadge, false, 'prop-3 should NOT show 360° tour badge');
  });

  await t.test('Filters and lists properties with 360° Virtual Tours', () => {
    const vrTours = MOCK_PROPERTIES.filter(p => p.virtualTour?.enabled);
    assert.ok(vrTours.length >= 3);
    const ids = vrTours.map(p => p.id);
    assert.ok(ids.includes('prop-1'));
    assert.ok(ids.includes('prop-2'));
    assert.ok(ids.includes('prop-4'));
    assert.ok(ids.includes('prop-6'));
  });
});
