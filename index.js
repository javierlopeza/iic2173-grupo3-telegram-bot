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


function echo(ctx, message) {
  // ctx.reply(message)
  // console.log(message)
}

const greeting = `*Bienvenido a Arquitrán Bot!* 👋 👨‍🔬

Aquí podrás acceder a los servicios de consulta y compra de productos de Arquitrán.
`

const commandList = `
*Listado de comandos* 👨‍💻 👩‍💻

*Usuario*
👤 \`/login user pass\` - Obtiene un token con las credenciales entregadas
👌 \`/validar token\` - Valida la identidad del usuario utilizando el token entregado.

*Consultas*
💊 \`/producto n\` - Consulta por la información del producto cuyo id es 'n'
📁 \`/productos\` - Muestra un listado de todos los productos con sus IDs.

*Compras*
🛒 \`/carrito\` - Muestra el carrito de compras actual
➕️ \`/agregar n m\` - Agrega al carrito el producto y la cantidad señalada.
🗑️ \`/vaciar\` - Vacía el carrito de compras
➕️ \`/despacho dirección\` - Agrega la dirección señalada a la orden de compra.
🛍️ \`/comprar\` - Envía la solicitud de compras con el estado del carrito
`

const validationHelp = `
*⚠ Autentificación requerida ⚠*

Para autentificarte, dirígete a [Arquitrán Web](https://arqss10.ing.puc.cl) y busca tu token 🎟 de validación en tu perfil. 

Luego, utilizando el token obtenido, ejecuta el comando: \`/validar token\`
para comenzar a utilizar ArquitranBot.
`

const validationSuccess = `
✅ * Autentificación exitosa!* ✅ 🔓 

Ahora podrás acceder a los servicios de Arquitrán por este canal! 💊 📋 
`

const bot = new Telegraf(token)
let userToken = "TokenIsMissing"

function setUser(ctx) {
  return new Promise((resolve, reject) => {
    Controller.find(ctx.from.id).then(user => {
      if (user) {
        echo(ctx, "User already stored")
        resolve(user)
      } else {
        echo(ctx, "Need to create user")
        userData = {
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name,
          id: ctx.from.id,
          token: userToken
        }
        Controller.create(userData).then(user => {
          echo(ctx, "New user created: " + user)
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
  echo(ctx, 'started: \nUser ID = ' + ctx.from.id)
  let loginData = {
    username: process.env.EMAIL_DEFAULT,
    password: process.env.PASSWORD_DEFAULT
  }
  setUser(ctx).then(user => {
    ctx.replyWithMarkdown(greeting + commandList)
    if (user.token == "TokenIsMissing") {
      ctx.replyWithMarkdown(validationHelp)
    }
  }).catch(err => {
    echo(ctx, "500 Server Error")
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
      console.log("Server Request Error: Unauthorized")
    })
  }
})

// Commands
bot.command('help', (ctx) => ctx.replyWithMarkdown(commandList))

bot.command('validar', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\/{1}\bvalidar\b\s{1}.*/i)) {
    let token = text.split(/\/{1}\bvalidar\b\s{1}/)[1]
    setUser(ctx).then(user => {
      Controller.update(user.id, {
          token
        })
        .then(user => {
          ctx.replyWithMarkdown(validationSuccess)
        }).catch(err => {
          echo(ctx, "Token update failed")
        })
    }).catch(err => {
      echo(ctx, "User not found")
    })
  }
})

bot.command('productos', (ctx) => {
  let pageNumber = 1
  setUser(ctx).then(user => {
    userToken = user.token
    if (userToken == "TokenIsMissing") {
      ctx.replyWithMarkdown(validationHelp)
      return
    }
    server.getAllProducts(userToken, pageNumber)
      .then(products => {
        let prev = pageNumber - 1
        let next = products.length > 0 ? pageNumber + 1 : 0
        let keyboard = helpers.paginationKeyboard(prev, next)
        let formattedData = helpers.formatProducts(products, pageNumber)
        ctx.replyWithMarkdown(formattedData, keyboard)
      }).catch(err => {
        echo(ctx, "Server request error: Unauthorized")        
      })
  }).catch(err => {
    echo(ctx, "User not found")
  })
})

bot.command('producto', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\bproducto\b\s{1}[1-9]{1,5}/i)) {
    let id = parseInt(text.split(" ")[1])
    setUser(ctx).then(user => {
      userToken = user.token
      if (user.token == "TokenIsMissing") {
        ctx.replyWithMarkdown(validationHelp)
        return
      }
      server.getProductById(userToken, id).then(product => {
        let formattedData = helpers.formatProduct(product)
        ctx.replyWithMarkdown(formattedData)
      }).catch(err => {
        echo(ctx, "Server request error")
      })
    }).catch(err => {
      echo(ctx, "User not found")
    })
  }
})

bot.command('carrito', (ctx) => {
  setUser(ctx).then(user => {
    // needs formatting
    if (user.token == "TokenIsMissing") {
      ctx.replyWithMarkdown(validationHelp)
      return
    }
    let cartAsMessage = user.purchase_cart.cart.length > 0 ? helpers.formatCart(user.purchase_cart) : "No has agregado nada a tu carrito! 🤷"
    echo(ctx, cartAsMessage)
    ctx.replyWithMarkdown(cartAsMessage)
  }).catch(err => {
    echo(ctx, "User setting failed")
  })
})

bot.command('agregar', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\/\bagregar\b\s{1}[1-9]{1,5}\s{1}[1-9]{1,5}/i)) {
    let id, quantity;
    [id, quantity] = text.split(/\/\bagregar\b\s{1}/i)[1].split(" ").map(val => parseInt(val))
    echo(ctx, `Parsed values to add: ${id} ${quantity}`)
    setUser(ctx).then(user => {
      if (user.token == "TokenIsMissing") {
        ctx.replyWithMarkdown(validationHelp)
        return
      }      
      server.getProductById(user.token, id).then(product => {
        let productData = {
          product_id: parseInt(product.id),
          price: parseInt(product.price),
          name: product.name,
          quantity: quantity
        }
        let existingProduct = user.purchase_cart.cart.filter(p => p.product_id == id)
        let cart = []
        if (existingProduct && existingProduct.length > 0){
          existingProduct = existingProduct[0]
          let accumulatedProduct = Object.assign({}, productData)
          accumulatedProduct.quantity = productData.quantity + existingProduct.quantity          
          cart = user.purchase_cart.cart.filter(p => p.product_id != id)
          cart = cart.concat([accumulatedProduct])
        } else {
          cart = user.purchase_cart.cart.concat([productData])
        }
        let newPurchaseCart = {          
          cart: cart,
          address: user.purchase_cart.address ? user.purchase_cart.address : ""
        }
        Controller.update(user.id, {
          purchase_cart: newPurchaseCart
        }).then(user => {
          echo(ctx, "Product successfully added: " + user.purchase_cart.cart)
          ctx.replyWithMarkdown("➕ " + helpers.formatProductForCart(productData))
          ctx.replyWithMarkdown(helpers.formatCart(user.purchase_cart))
        }).catch(err => {
          echo(ctx, "Error updating the cart!")
        })
      }).catch(err => {
        echo(ctx, "Failed to retrieve product info: ", err)
      })
    }).catch(err => {
      echo(ctx, "User not found")
    })
  }
})

bot.command('comprar', (ctx) => {
  setUser(ctx).then(user => {
    userToken = user.token
    if (userToken == "TokenIsMissing") {
      ctx.replyWithMarkdown(validationHelp)
      return
    } else if (user.purchase_cart.cart.length == 0) {
      echo(ctx, "Cart is empty, cannot make purchase :(")
      ctx.replyWithMarkdown("Tu carrito aún está vacío 🛒\nPrueba agregando productos con el comando \`\/agregar\`")
      return
    } else if(user.purchase_cart.address == "") {
      ctx.replyWithMarkdown(`📍 Ubicación no detallada ⚠️ \nDebes indicar una dirección para poder realizar la compra!`)
      return
    }
    let productsToBuy = user.purchase_cart.cart.map(item => {
      return {
        product_id: item.product_id,
        quantity: item.quantity
      }
    })
    echo(ctx, "Preparing to purchase: " + JSON.stringify(productsToBuy))
    let shoppingCart = {
      cart: productsToBuy,
      address: user.purchase_cart.address == "" ? "Mi casa" : user.purchase_cart.address
    }
    echo(ctx, "Shopping Cart Built: " + JSON.stringify(shoppingCart))
    server.buyProducts(userToken, shoppingCart).then(purchases => {
      echo(ctx, JSON.stringify(purchases))
      let acceptedPurchasesMessage = ""
      let rejectedPurchasesMessage = ""
      if (purchases && purchases.success) {
        acceptedPurchasesMessage = purchases.accepted.length > 0 ? helpers.formatAcceptedPurchases(purchases.accepted) : ""      
        rejectedPurchasesMessage = purchases.rejected.length > 0 ? helpers.formatRejectedPurchases(purchases.rejected) : ""  
      }
      let purchasesSummary = `*RESUMEN DE COMPRAS*\n` + acceptedPurchasesMessage + "\n\n" + rejectedPurchasesMessage
      ctx.replyWithMarkdown(purchasesSummary)
      Controller.update(user.id, {
        purchase_cart: {
          cart: [],
          address: user.purchase_cart.address ? user.purchase_cart.address : ""
        }
      }).then(user => {
        ctx.replyWithMarkdown("Tu carrito fue vaciado 🗑️\nPara iniciar una nueva compra, agrega productos con el comando \`\/agregar\`")
      }).catch(err => {
        echo(ctx, "Error emptying the cart!")
      })
    }).catch(err => {
      echo(ctx, "Server request error (purchases)")
    })
  }).catch(err => {
    echo(ctx, "User not found")
  })
})

bot.command('despacho', (ctx) => {
  setUser(ctx).then(user => {
    if (user.token == "TokenIsMissing") {
      ctx.replyWithMarkdown(validationHelp)
      return
    }
    let text = ctx.update.message.text
    if (text.match(/\/\bdespacho\b\s{1}(\w+\s?)+/i)) {
      let address = text.split(/\/\bdespacho\b\s{1}/i)[1]
      Controller.update(user.id, {
        purchase_cart: {
          cart: user.purchase_cart.cart,
          address: address
        }
      }).then(user => {
        echo(ctx, "The puchase cart is now empty!")
        ctx.replyWithMarkdown("Se ha cambiado tu dirección de despacho!")
      }).catch(err => {
        echo(ctx, "Error emptying the cart!")
      })
    } else {
      ctx.replyWithMarkdown(`Por favor ingresa una dirección válida :(`)
    }
  }).catch(err => {
    echo(ctx, "User not found")
  })
})

bot.command('vaciar', (ctx) => {
  setUser(ctx).then(user => {
    if (user.token == "TokenIsMissing") {
      ctx.replyWithMarkdown(validationHelp)
      return
    }
    Controller.update(user.id, {
      purchase_cart: {
        cart: [],
        address: user.purchase_cart.address ? user.purchase_cart.address : ""
      }
    }).then(user => {
      echo(ctx, "The puchase cart is now empty!")
      ctx.replyWithMarkdown("Tu carrito fue vaciado 🗑️\n")
    }).catch(err => {
      echo(ctx, "Error emptying the cart!")
    })
  }).catch(err => {
    echo(ctx, "User not found")
  })
})

bot.command('quitar', (ctx) => {
  echo(ctx, "feature in process...")
})

// THIS IS JUST FOR DEVELOPMENT (login command)

bot.command('login', (ctx) => {
  let text = ctx.update.message.text
  if (text.match(/\/{1}\blogin\b\s{1}.*/i)) {
    let auth = text.split(/\/{1}\blogin\b\s{1}/)[1].split(" ")
    let loginData = {
      username: auth[0],
      password: auth[1]
    }
    setUser(ctx).then(user => {
      server.signIn(loginData).then(res => {
        if (res.success) {
          echo(ctx, "Login to Arquitrán Successful")
          ctx.reply("Login a Arquitrán exitoso!")
          userToken = res.token
          if (token) echo(ctx, "Token retrieved correctly")
          Controller.update(user.id, {
              token: userToken
            })
            .then(user => {
              echo(ctx, "New token stored")
              ctx.replyWithMarkdown(validationSuccess)
            }).catch(err => {
              echo(ctx, "Token update failed")
            })
        } else {
          echo(ctx, "couldn't login correctly")
        }
      }).catch(err => {
        echo(ctx, err)
      })
    }).catch(err => {
      echo(ctx, "User not found")
    })
  }
})

// Use polling to get incoming messages
bot.startPolling()