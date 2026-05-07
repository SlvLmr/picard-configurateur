// Barrel file: load all catalog data from JSON.
// Decap CMS edits the JSON files directly; everything in the app
// imports from here.
import decorsData from './decors.json';
import doorsData from './doors.json';
import colorsData from './colors.json';
import handlesData from './handles.json';
import glassesData from './glasses.json';
import accessoriesData from './accessories.json';
import finishesData from './finishes.json';
import hotspotsData from './hotspots.json';

export const decors = decorsData.items;
export const doors = doorsData.items;
export const colors = colorsData.items;
export const handles = handlesData.items;
export const glasses = glassesData.items;
export const accessories = accessoriesData.items;
export const finishes = finishesData.items;
export const hotspots = hotspotsData.items;

// Filter helpers honouring `compatibleDoorIds` (empty array = compatible with all).
function isCompatibleWith(doorId, item) {
  if (!item.compatibleDoorIds || item.compatibleDoorIds.length === 0) return true;
  return item.compatibleDoorIds.includes(doorId);
}

export function decorsForDoor(doorId) {
  return decors.filter((d) => isCompatibleWith(doorId, d));
}

export function accessoriesForDoor(doorId) {
  return accessories.filter((a) => isCompatibleWith(doorId, a));
}

export function handlesForDoor(doorId) {
  return handles.filter((h) => isCompatibleWith(doorId, h));
}

export function glassesForDoor(doorId) {
  return glasses.filter((g) => isCompatibleWith(doorId, g));
}
