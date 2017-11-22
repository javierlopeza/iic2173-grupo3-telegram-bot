require('dotenv').config();

// Setup mongoDB
let mongo = require('./config/mongo')

// Call controller to operate with User class
let User = require('./models/user')
let Controller = require('./controllers/user-controller')
let helpers = require('./lib/helpers')

const token = process.env.TEST_TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const server = require('./lib/arquitran-server')

const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')


const greeting = `*Bienvenido a Arquitrán Bot!*
Aquí podrás acceder a los servicios de consulta y compra de productos de Arquitrán.
`

const commandList = `
*Listado de comandos*:

\`/validar token\` - Valida la identidad del usuario utilizando el token entregado.
\`/productos\` - Muestra un listado de todos los productos con sus IDs.
\`/producto n\` - Consulta por la información del producto cuyo id es 'n'
\`/carrito\` - Muestra el carrito de compras actual
\`/agregar n m\` - Agrega al carrito el producto y la cantidad señalada.
\`/comprar\` - Envía la solicitud de compras con el estado del carrito
\`/vaciar\` - Vacía el carrito de compras
\`/quitar n\` - Remueve el producto n del carrito de compras
`

const bot = new Telegraf(token)
let userToken = "TokenIsMissing"

function setUser(ctx) {
  return new Promise((resolve, reject) => {
    Controller.find(ctx.from.id).then(user => {
      if (user) {
        console.log("User already stored")
        ctx.reply(`Datos estaban en la db`)
        resolve(user)
      } else {
        console.log("Need to create user")
        userData = {
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name,
          id: ctx.from.id,
          token: userToken
        }
        Controller.create(userData).then(user => {
          console.log(user)
          ctx.reply('se creó un nuevo usuario en la db')
          ctx.reply(`
          Para autentificarte, dirígete a https://arqss10.ing.puc.cl
          y busca tu token de validación.
          Luego, utiliza el comando '/validar mitoken'
          para comenzar a utilizar el bot
          `)
          resolve(user)
        }).catch(err => {
          console.log(err)
          reject(err)
        })
      }
    }).catch(err => {
      console.log("Error in find function")
      reject(err)
    })
  })
}

bot.start((ctx) => {
  console.log('started: \nUser ID = ', ctx.from.id)
  let loginData = {
    username: process.env.EMAIL_DEFAULT,
    password: process.env.PASSWORD_DEFAULT
  }
  setUser(ctx).then(user => {
    userToken = user.token
    ctx.replyWithMarkdown(greeting + commandList)
  }).catch(err => {
    ctx.reply("500 Server Error")    
    // server.signIn(loginData).then(res => {
    //   if (res.success) {
    //     console.log("Login to Arquitrán Successful")
    //     userToken = res.token
    //     ctx.replyWithMarkdown(greeting + commandList)
    //     if (userToken) console.log("Token retrieved correctly")      
    //   } else {
    //     console.log("couldn't login correctly")
    //   }
    // }).catch(err => {
    //   console.log(err)
    // })
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
      let keyboard = helpers.paginationKeyboard(prev, next)
      let formattedData = helpers.formatProducts(products, pageNumber)
      ctx.replyWithMarkdown(formattedData, keyboard)
    }).catch(err => {
      console.log("Failed to retrieve products")
      console.log(err)
    })
  }
})

// Commands
bot.command('help', (ctx) => ctx.replyWithMarkdown(commandList))

bot.command('validar', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\bvalidar\b\s{1}.*/i)) {
    console.log("comando cashao")
    let token = text.split(/\bvalidar\b\s{1}/)[1]
    console.log(`token = ${token}`)
    setUser(ctx).then(user => {
      Controller.update(user.id, {token}).then(user => {
        ctx.reply("CAMBIASTE TU TOKEN!")
      }).catch(err => {
        console.log("error en validar")
        ctx.reply("No funcionó validar")
      })  
    }).catch(err => {
      ctx.reply("usuario no encontrado")
      console.log("usuario no encontrado")
    })
  }
})

bot.command('productos', (ctx) => {
  let pageNumber = 1 
  setUser(ctx).then(user => {
    userToken = user.token
    server.getAllProducts(userToken, pageNumber).then(products => {
      let prev = pageNumber - 1
      let next = products.length > 0 ? pageNumber + 1 : 0
      let keyboard = helpers.paginationKeyboard(prev, next)
      let formattedData = helpers.formatProducts(products, pageNumber)
      ctx.replyWithMarkdown(formattedData, keyboard)
    }).catch(err => {
      console.log("Failed to retrieve products")
      console.log(err)
    })
  }).catch(err => {
    console.log("falló setUser")
  })
})

bot.command('producto', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\bproducto\b\s{1}[1-9]{1,5}/i)) {
    let id = parseInt(text.split(" ")[1])
    server.getProductById(userToken, id).then(product => {
      let formattedData = helpers.formatProduct(product)
      ctx.replyWithMarkdown(formattedData)
    }).catch(err => {
      console.log("Failed to retrieve products")
      console.log(err)
    })
  }
})

bot.command('carrito', (ctx) => {
  Controller.find(ctx.from.id).then(user => {
    ctx.reply(JSON.stringify(user.purchase_cart.cart))
  }).catch(err => {
    console.log("User not found")
    ctx.reply("Error")
  })
})

bot.command('agregar', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\bproducto\b\s{1}[1-9]{1,5}/i)) {
    let id = parseInt(text.split(" ")[1])
    server.getProductById(userToken, id).then(product => {
      let formattedData = helpers.formatProduct(product)
      ctx.replyWithMarkdown(formattedData)
    }).catch(err => {
      console.log("Failed to retrieve products")
      console.log(err)
    })
  }
})

bot.command('comprar', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\bproducto\b\s{1}[1-9]{1,5}/i)) {
    let id = parseInt(text.split(" ")[1])
    server.getProductById(userToken, id).then(product => {
      let formattedData = helpers.formatProduct(product)
      ctx.replyWithMarkdown(formattedData)
    }).catch(err => {
      console.log("Failed to retrieve products")
      console.log(err)
    })
  }
})

bot.command('vaciar', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\bproducto\b\s{1}[1-9]{1,5}/i)) {
    let id = parseInt(text.split(" ")[1])
    server.getProductById(userToken, id).then(product => {
      let formattedData = helpers.formatProduct(product)
      ctx.replyWithMarkdown(formattedData)
    }).catch(err => {
      console.log("Failed to retrieve products")
      console.log(err)
    })
  }
})

bot.command('quitar', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\bproducto\b\s{1}[1-9]{1,5}/i)) {
    let id = parseInt(text.split(" ")[1])
    server.getProductById(userToken, id).then(product => {
      let formattedData = helpers.formatProduct(product)
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