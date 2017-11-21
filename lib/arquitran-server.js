let request = require('request')

function buildOptions(method, path, body = null, token = null) {
  // token = "tokenx"
  let object = {
    url: process.env.SERVER_URL + path,
    method: method.toUpperCase(),
    json: true,
    headers: {
      'Content-Type': 'application/json',
    }
  }
  object.headers['Authorization'] = token
  if (method == "POST") {
    object.json = JSON.parse(body)
  }
  return object
}

function asyncRequest(options) {
  if (options.method == "GET") {
    return new Promise(function (resolve, reject) {
      request.get(options, (err, res, body) => {
        if (!err && res.statusCode == 200) {
          resolve(body)
        } else {
          reject(err)
        }
      })
    })
  } else if (options.method == "POST"){
    return new Promise(function (resolve, reject) {
      request.post(options, (err, res, body) => {
        if (!err && res.statusCode == 200) {
          resolve(body)
        } else {
          reject(err)
        }
      })
    })
  }
}

async function signIn(data) {
  let postBody = JSON.stringify(data)
  let options = buildOptions('POST', '/api/signin', postBody, null)
  let res = await asyncRequest(options)
  // console.log(res)
  return res
}

async function getAllProducts(token, page=1) {
  let options = buildOptions('GET', `/api/products?page=${page}`, null, token)
  let res = await asyncRequest(options)
  // console.log(res)
  return res
}

async function getProductById(token, id) {
  let options = buildOptions('GET', `/api/product/${id}`, null, token)
  let res = await asyncRequest(options)
  // console.log(res)
  return res
}

async function getAllCategories(token) {
  let options = buildOptions('GET', '/api/categories', null, token)
  let res = await asyncRequest(options)
  // console.log(res)
  return res
}

async function buyProducts(token, shoppingCart) {
  let postBody = JSON.stringify(shoppingCart)
  let options = buildOptions('POST', '/api/transaction', postBody, token)
  let res = await asyncRequest(options)
  // console.log(res)
  return res
}

module.exports = {
  signIn,
  getAllProducts,
  getProductById,
  getAllCategories,
  buyProducts
}
