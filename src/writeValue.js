const j = require('jscodeshift')

/**
 * @param {j.ObjectExpression|j.ArrayExpression|j.Literal} root
 * @param {Array|Object|String|Number|Boolean|null}
 */
function writeValue(root, value) {
  if (value === undefined) return root

  root = rootMatchesValue(root, value) ? root : createRoot(value)

  if (root.type === 'ArrayExpression') {
    writeArray(root, value)
  } else if (root.type === 'ObjectExpression') {
    writeObj(root, value)
  } else if (root.type === 'Literal') {
    root.value = value
  }
  return root
}

function rootMatchesValue(root, value) {
  if (root === undefined) return false

  return (
    (root.type === 'ArrayExpression' && isArray(value)) ||
    (root.type === 'ObjectExpression' && isObj(value)) ||
    root.type === 'Literal'
  )
}

function createRoot(value) {
  if (isArray(value)) {
    return j.arrayExpression([])
  }
  if (isObj(value)) {
    return j.objectExpression([])
  }
  return j.literal('')
}

function writeArray(root, value) {
  value.forEach((value, index) => {
    const existingElement = root.elements[index]
    root.elements[index] = writeValue(existingElement, value)
  })
  root.elements.length = value.length
}

function writeObj(root, obj) {
  const newProperties = []
  Object.keys(obj).forEach((key, index) => {
    const value = obj[key]
    const existingProperty = findPropertyByKey(root.properties, key)
    if (existingProperty) {
      existingProperty.value = writeValue(existingProperty.value, value)
      newProperties.push(existingProperty)
    } else {
      const newValue = writeValue(undefined, value)
      const newKey = getNewPropertyKey(root.properties, key)
      const newProperty = j.property('init', newKey, newValue)
      newProperties.push(newProperty)
    }
  })
  root.properties = newProperties
}

function findPropertyByKey(properties, key) {
  return properties.find(p => {
    return (p.key.name || p.key.value) === key
  })
}

function getNewPropertyKey(properties, key) {
  // if the key has invalid characters, it has to be a literal
  if (key.match(/[^a-zA-Z0-9_]/)) {
    return j.literal(key)
  }

  // infer whether to use a literal or identifier by looking at the other keys
  const useIdentifier =
    properties.length === 0 || properties.some(p => p.key.type === 'Identifier')
  return useIdentifier ? j.identifier(key) : j.literal(key)
}

function isObj(value) {
  return typeof value === 'object' && !isArray(value)
}

function isArray(value) {
  return Array.isArray(value)
}

module.exports = writeValue
