const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

function formatProduct(p) {
  return `  *${p.name} (id: ${p.id})*
    ⋅ Valor: $${p.price}
    ⋅ Grupo: ${p.category.group}
    ⋅ Contexto: ${p.category.context}
    ⋅ Área: ${p.category.area}`
}

function formatProductForCart(p) {
  return `  *${p.name} (id: ${p.product_id})*
    ⋅ Cantidad: ${p.quantity}
    ⋅ Valor Unitario: $${p.price}
    ⋅ Total: $${p.price * p.quantity}`    
}

function formatAcceptedProduct(p) {
  //       ⋅ Grupo: ${p.category.group}
  //       ⋅ Contexto: ${p.category.context}
  //       ⋅ Área: ${p.category.area}
  return `
    *${p.name} (id: ${p.product_id})*
      ⋅ Valor: $${p.price}
      ⋅ Cantidad: ${p.quantity}
      ⋅ Detalle: Aprobado\n`
}

function formatRejectedProduct(p) {
  //       ⋅ Grupo: ${p.category.group}
  //       ⋅ Contexto: ${p.category.context}
  //       ⋅ Área: ${p.category.area}
  return `
    *${p.name} (id: ${p.product_id})*
      ⋅ Valor: $${p.price}
      ⋅ Cantidad: ${p.quantity}
      ⋅ Motivo de Rechazo: ${p.rejected_reason}\n`
}

function simpleFormatProduct(p) {
  let id = p.id.length > 10 ? p.product_id : p.id
  return `⋅ *${p.name} (id: ${id})* | $${p.price}`
}

function paginationKeyboard(prev, next) {
  let keys = []
  if (prev > 0) {
    keys.push({
      text: `⬅️  Página ${prev}`,
      callback_data: `page ${prev}`
    })
  }
  if (next > 0) {
    keys.push({
      text: `Página ${next} ➡️ `,
      callback_data: `page ${next}`
    })
  }
  return Markup.inlineKeyboard([keys]).oneTime().resize().extra()
}

function formatCart(purchasesCart, address="") {
  let title = `*Carrito de Compras* 🛒
  -------------------------------------\n\n`  
  let productsList = purchasesCart.cart.map(p => formatProductForCart(p)).join("\n\n")
  let addressInfo = `\n\n-------------------------------------\n`
  if (purchasesCart.address == "") {
    addressInfo += `📍 Ubicación no detallada ⚠️ \nDebes indicar una dirección para poder realizar la compra!`
  } else {
    addressInfo += `📍 Ubicación: _${purchasesCart.address}_` 
  }
  return title + productsList + addressInfo
}

function formatProducts(products, pageNumber) {
  let title = `*Listado de productos - Página ${pageNumber}*
-------------------------------------\n\n`
  let productsList = products.map(p => formatProduct(p)).join("\n\n")
  return title + productsList
}

function formatAcceptedPurchases(purchases) {
  let purchasesTitle = `*Estas son sus compras aceptadas:*\n`
  let purchasesInfo = purchases.map((p) => {
    return formatAcceptedProduct(p)
  })
  let purchasesBody = purchasesInfo.reduce((prev, current) => {
    return prev + current
  })
  console.log(purchasesTitle + purchasesBody)
  return purchasesTitle + purchasesBody
}

function formatRejectedPurchases(purchases) {
  let purchasesTitle = `*Estas son sus compras rechazadas:*\n`
  let purchasesInfo = purchases.map((p) => {
    return formatRejectedProduct(p)
  })
  let purchasesBody = purchasesInfo.reduce((prev, current) => {
    return prev + current
  })
  console.log(purchasesTitle + purchasesBody)
  return purchasesTitle + purchasesBody
}


module.exports = {
  formatProduct,
  formatProductForCart,
  paginationKeyboard,
  formatProducts,
  formatAcceptedPurchases,
  formatRejectedPurchases,
  formatCart
}