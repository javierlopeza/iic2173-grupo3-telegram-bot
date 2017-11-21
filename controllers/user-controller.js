'use strict'

let mongoose = require('mongoose'),
  User = require('../models/userModel')

exports.findAll = function () {
  User
    .find({}, function (err, users) {
      if (err) {
        return err
      }
      return users
    })
}

exports.create = function (data) {
  let new_user = new User(data)
  new_user.save(function (err, user) {
    if (err) {
      return err
    }
    return user
  })
}

exports.find = function (id) {
  User
    .findOne({
      'id': id
    }, function (err, user) {
      if (err) {
        return err
      }
      return user
    })
}

exports.update = function (id, data) {
  User
    .findOneAndUpdate({
      'id': id
    }, data, {
      new: true
    }, function (err, user) {
      if (err) {
        return err
      }
      return user
    })
}