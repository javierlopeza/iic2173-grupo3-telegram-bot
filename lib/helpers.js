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

function createAcceptedPurchasesTable(purchases) {
  let purchasesTitle = `<h3>Estas son sus compras aceptadas:</h3>`
  let purchasesHeaders = `
  <tr>
    <th>ID</th>
    <th>Nombre</th> 
    <th>Precio</th>
    <th>Cantidad</th>
    <th>Contexto</th>
    <th>Área</th>
    <th>Grupo</th>
    <th>Detalle</th>
  </tr>`
  let purchasesInfo = purchases.map((p) => `
    <tr>
      <td>${p.product_id}</td>
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.quantity}</td>      
      <td>${p.category.context}</td>
      <td>${p.category.area}</td>
      <td>${p.category.group}</td>
      <td>Aprobado</td>
    </tr>`)
  let purchasesTableBody = purchasesInfo.reduce((prev, current) => {
    return prev + current
  })
  let purchasesTable = `<table>${purchasesHeaders}${purchasesTableBody}</table>`
  return purchasesTitle + purchasesTable
}

function createRejectedPurchasesTable(purchases) {
  let purchasesTitle = `<h3>Estas son sus compras rechazadas:</h3>`
  let purchasesHeaders = `
  <tr>
    <th>ID</th>
    <th>Nombre</th> 
    <th>Precio</th>
    <th>Cantidad</th>
    <th>Contexto</th>
    <th>Área</th>
    <th>Grupo</th>
    <th>Motivo de Rechazo</th>
  </tr>`
  let purchasesInfo = purchases.map((p) => `
    <tr>
      <td>${p.product_id}</td>
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.quantity}</td>
      <td>${p.category.context}</td>
      <td>${p.category.area}</td>
      <td>${p.category.group}</td>
      <td>${p.rejected_reason}</td>      
    </tr>`)
  let purchasesTableBody = purchasesInfo.reduce((prev, current) => {
    return prev + current
  })
  let purchasesTable = `<table>${purchasesHeaders}${purchasesTableBody}</table>`
  return purchasesTitle + purchasesTable
}

module.exports = {
  formatProduct,
  paginationKeyboard,
  formatProducts
}