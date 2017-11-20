require('dotenv').config();

const token = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const server = require('./lib/arquitran-server')

const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')


const commandReference = `*Bienvenido a Arquitrán Bot!*
Aquí podrás acceder a los servicios de consulta y compra de productos de Arquitrán.

*Listado de comandos*:
\`/productos\` - Muestra un listado de todos los productos con sus IDs.
\`/producto X\` - Consulta por la información del producto cuyo id es 'n'
\`/comprar\` - Accede al menú de compras.

*Comandos de compra*:
`

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

const bot = new Telegraf(token)
let userToken = "TokenIsMissing"

bot.start((ctx) => {
  console.log('started:', ctx.from.id)
  let loginData = {
    username: process.env.EMAIL_DEFAULT,
    password: process.env.PASSWORD_DEFAULT
  }
  server.signIn(loginData).then(res => {
    if (res.success) {
      console.log("Login to Arquitrán Successful")
      userToken = res.token
      ctx.replyWithMarkdown(commandReference)
      console.log(userToken)
    } else {
      console.log("couldn't login correctly")
    }
  }).catch(err => {
    console.log(err)
  })
})

// Middleware
bot.use((ctx, next) => {
  const start = new Date()
  return next(ctx).then(() => {
    const ms = new Date() - start
    console.log('Response time %sms', ms)
  })
})

bot.on('callback_query', (ctx) => {
  let data = ctx.update.callback_query.data
  if (data.match(/\bpage\b\s{1}[1-9]{1,2}/i)) {
    let pageNumber = parseInt(data.split(" ")[1])
    console.log("Solicitando página: " + pageNumber)
    server.getAllProducts(userToken, pageNumber).then(products => {
      let prev = pageNumber - 1
      let next = products.length == 10 ? pageNumber + 1 : 0
      let keyboard = paginationKeyboard(prev, next)
      let formattedData = formatProducts(products, pageNumber)
      ctx.replyWithMarkdown(formattedData, keyboard)
    }).catch(err => {
      console.log("Failed to retrieve products")
      console.log(err)
    })
  }
})

// Commands
bot.command('help', (ctx) => ctx.reply('Try send a sticker!'))

bot.command('productos', (ctx) => {
  let pageNumber = 1
  server.getAllProducts(userToken, pageNumber).then(products => {
    let prev = pageNumber - 1
    let next = products.length > 0 ? pageNumber + 1 : 0
    let keyboard = paginationKeyboard(prev, next)
    let formattedData = formatProducts(products, pageNumber)
    ctx.replyWithMarkdown(formattedData, keyboard)
  }).catch(err => {
    console.log("Failed to retrieve products")
    console.log(err)
  })
})

bot.command('producto', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\bproducto\b\s{1}[1-9]{1,5}/i)) {
    let id = parseInt(text.split(" ")[1])
    server.getProductById(userToken, id).then(product => {
      let formattedData = formatProduct(product)
      ctx.replyWithMarkdown(formattedData)
    }).catch(err => {
      console.log("Failed to retrieve products")
      console.log(err)
    })
  }
})

// Text recognition
bot.hears('hi', (ctx) => ctx.reply('Hey there!'))
bot.hears(/buy/i, (ctx) => ctx.reply('Buy-buy!'))

// Event Handlers
bot.on('sticker', (ctx) => ctx.reply('👍'))


// Use polling to get incoming messages
bot.startPolling()