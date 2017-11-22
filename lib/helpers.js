const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

function formatProduct(p) {
  return `  *${p.name} (id: ${p.id})*
    ⋅ Valor: $${p.price}
    ⋅ Grupo: ${p.category.group}
    ⋅ Contexto: ${p.category.context}
    ⋅ Área: ${p.category.area}`
}

function simpleFormatProduct(p) {
  return `⋅ *${p.name} (id: ${p.id})* | $${p.price}`
}

function paginationKeyboard(prev, next) {
  let keys = []
  if (prev > 0) {
    keys.push({
      text: `<< Página anterior (${prev})`,
      callback_data: `page ${prev}`
    })
  }
  if (next > 0) {
    keys.push({
      text: `Página siguiente (${next}) >>`,
      callback_data: `page ${next}`
    })
  }
  return Markup.inlineKeyboard([keys]).oneTime().resize().extra()
}

function formatProducts(products, pageNumber) {
  let title = `*Listado de productos - Página ${pageNumber}*
-------------------------------------\n\n`
  productsList = products.map(p => simpleFormatProduct(p)).join("\n\n")
  return title + productsList
}

module.exports = {
  formatProduct,
  paginationKeyboard,
  formatProducts
}