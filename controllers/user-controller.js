'use strict'

let mongoose = require('mongoose'),
  User = require('../models/user')

exports.findAll = function () {
  return new Promise(function (resolve, reject) {
    User
      .find({}, function (err, users) {
        if (err) {
          reject(err)
        } else {
          resolve(users)
        }
      })
  })
}

exports.create = function (data) {
  return new Promise(function (resolve, reject) {
    let new_user = new User(data)
    new_user.save(function (err, user) {
      if (err) {
        reject(err)
      } else {
        resolve(user)
      }
    })
  })
}

exports.find = function (id) {
  return new Promise(function (resolve, reject) {
    User
      .findOne({
        'id': id
      }, function (err, user) {
        if (err) {
          reject(err)
        } else {
          resolve(user)
        }
      })
  })
}

exports.update = function (id, data) {
  return new Promise(function (resolve, reject) {
    User
      .findOneAndUpdate({
        'id': id
      }, data, {
        new: true
      }, function (err, user) {
        if (err) {
          reject(err)
        } else {
          resolve(user)
        }
      })
    })
}