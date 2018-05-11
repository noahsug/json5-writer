const j = require('jscodeshift')

// @param {j.ObjectExpression|j.ArrayExpression|j.Literal} node
function writeValue(node, value) {
  if (value === undefined) return node

  node = nodeTypeMatchesValue(node, value) ? node : createEmptyNode(value)

  if (node.type === 'ArrayExpression') {
    writeArray(node, value)
  } else if (node.type === 'ObjectExpression') {
    writeObj(node, value)
  } else if (node.type === 'Literal') {
    node.value = value
  }
  return node
}

function nodeTypeMatchesValue(node, value) {
  if (node === undefined) return false

  return (
    (node.type === 'ArrayExpression' && isArray(value)) ||
    (node.type === 'ObjectExpression' && isObj(value)) ||
    node.type === 'Literal'
  )
}

function createEmptyNode(value) {
  if (isArray(value)) {
    return j.arrayExpression([])
  }
  if (isObj(value)) {
    return j.objectExpression([])
  }
  return j.literal('')
}

function writeArray(node, value) {
  value.forEach((value, index) => {
    const existingElement = node.elements[index]
    node.elements[index] = writeValue(existingElement, value)
  })
  node.elements.length = value.length
}

function writeObj(node, obj) {
  const newProperties = []
  Object.keys(obj).forEach((key, index) => {
    const existingProperty = findPropertyByKey(node.properties, key)
    if (existingProperty) {
      existingProperty.value = writeValue(existingProperty.value, obj[key])
      newProperties.push(existingProperty)
    } else {
      const newKey = getNewPropertyKey(node.properties, key)
      const newValue = writeValue(undefined, obj[key])
      const newProperty = j.property('init', newKey, newValue)
      newProperties.push(newProperty)
    }
  })
  node.properties = newProperties
}

function findPropertyByKey(properties, key) {
  return properties.find(p => (p.key.name || p.key.value) === key)
}

function getNewPropertyKey(properties, key) {
  // if the key has invalid characters, it has to be a string literal
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
