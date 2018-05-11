const j = require('jscodeshift')
const writeValue = require('./writeValue')

function load(src) {
  const ast = toAst(src)
  const root = ast.nodes()[0].program.body[0].expression

  function toAst(src) {
    // find the start of the outermost array or object
    const expressionStart = src.match(/^\s*[{\[]/m)
    if (expressionStart) {
      // hackily insert "x=" so the JSON5 becomes valid JavaScript
      const astSrc = src.replace(/^\s*([{\[])/m, 'x=$1')
      return j(astSrc)
    }

    // no array or object exist in the JSON5
    return j('x={}')
  }

  // @param {Object|Array} value
  function write(value) {
    root.right = writeValue(root.right, value)
  }

  function toSource(options = {}) {
    // set default options
    options = {
      quote: 'single',
      trailingComma: true,
      ...options,
    }
    // strip the "x=" prefix
    return ast.toSource(options).replace(/^x=([{\[])/m, '$1')
  }

  return { write, toSource, ast: j(root.right) }
}

module.exports = { load }
