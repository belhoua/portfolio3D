import * as THREE from 'three'

/**
 * Convert geographic coordinates to a 3D position on a sphere.
 * @param {number} lat  — latitude in degrees (-90 … 90)
 * @param {number} lon  — longitude in degrees (-180 … 180)
 * @param {number} radius — sphere radius
 * @returns {THREE.Vector3}
 */
export function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon + 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

/** Quaternion that rotates the globe so (lat, lon) faces +Z (camera). */
export function getQuaternionToFace(lat, lon) {
  const local = latLonToVector3(lat, lon, 1).normalize()
  const target = new THREE.Vector3(0, 0, 1)
  return new THREE.Quaternion().setFromUnitVectors(local, target)
}

/** Read a CSS custom property from :root (with hex fallback). */
export function getCssColor(varName, fallback) {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return v || fallback
}
