const express = require('express')
const multer = require('multer')
const Router = express.Router()
const parser = require('parser')
const AccountStudent = require('../models/AccountStudentModel')
const Notification = require('../models/NotificationModel')
const ContentPost = require('../models/ContentModel')
const { htmlToText } = require('html-to-text');
const formidable = require('formidable')
const fs = require('fs')
const cors = require('cors')
const ObjectID = require('mongodb').ObjectID;
const app = express()
app.use(cors())
const upload = multer({
    dest: 'uploads',
    fileFilter: (req, file, callback) => {

        if (file.mimetype.startsWith('image/')) {
            callback(null, true) // cho phep upload
        }
        else callback(null, false) // không cho upload loại file khác ảnh

    }, limits: { fileSize: 500000 }
})

app.set('view engine', 'ejs')

Router.post('/update', (req, res) => {
    let result = ''
    req.on('data', d => result += d.toString())
    req.on('end', () => {
        data = JSON.parse(result)
        AccountStudent.findOneAndUpdate({ email: data.emailStu }, { name: data.name, faculty: data.faculty, class: data.clas })
            .then(p => {
                if (p) {
                    return res.json({ code: 0, message: "Không lỗi" })
                }
                return res.json({ code: 1, message: "Đã lỗi" })
            })
            .catch(e => {
                return res.json({ code: 1, message: "Đã lỗi" })
            })
    })
})
Router.get('/:id', (req, res) => {
    let email = (req.params.id)
    AccountStudent.findOne({ email: email })
        .then(a => {
            ContentPost.find({ email: email })
                .then(p => {
                    if (p) {
                        return res.render('oneStudent', { name: a.name, posts: p })
                    }
                })
        })

})
Router.post('/allStatus', (req, res) => {
    ContentPost.find({})
        .then(p => {
            res.json({ code: 0, status: p })
        })
        .catch(e => {
            res.json({ code: 1, message: 'Lỗi ' + e })
        })

})
Router.post('/do-upload-image', (req, res) => {
    var formData = new formidable.IncomingForm();
    formData.parse(req, (error, fields, files) => {
        var oldPath = files.file.path;
        var newPath = "static/images/" + files.file.name;
        fs.rename(oldPath, newPath, (err) => {
            res.send("/" + newPath)
        })

    })
})
Router.post('/upload', (req, res) => {
    let result = ''
    req.on('data', d => result += d.toString())
    req.on('end', () => {
        dataPost = JSON.parse(result)

        var encodeText = htmlToText(dataPost.contextPost)
        let contPost = new ContentPost({
            name: dataPost.name,
            email: dataPost.email,
            titlePost: dataPost.titlePost,
            datePost: dataPost.datePost,
            contextPost: htmlToText(dataPost.contextPost),
            image: dataPost.image
        })
        contPost.save()
        res.json({ code: 0, message: 'Khong loi', dataPost: contPost._id })
    })
})
Router.get('/', (req, res) => {
    let emailStu = req.session.user
    AccountStudent.findOne({ email: emailStu })
        .then(p => {
            if (p) {
                var nameSt = p.name;
                var emailSt = p.email;
                ContentPost.find({ email: emailStu })
                    .then(p => {
                        p = p.reverse()
                        Notification.find({})
                            .then(n => {
                                res.render('studentInterface', { notifications: n, nameStun: nameSt, emailStun: emailSt, postS: p })
                            })
                    })
            }

        })
        .catch(e => console.log(e.message))
})
Router.post('/post', (req, res) => {
    let { id } = req.body
    ContentPost.findOne({ _id: ObjectID(id) })
        .then(p => {
            return res.json({ code: 0, message: 'Lấy thành công', data: p })
        })
})

Router.post('/post/edit', (req, res) => {
    let result = ''
    req.on('data', d => {
        result += d.toString()
    })
    req.on('end', () => {
        let data = JSON.parse(result)
        ContentPost.findByIdAndUpdate({ _id: ObjectID(data.id) }, { titlePost: data.titlePost, contextPost: htmlToText(data.contextPost) })
            .then(p => {
                if (p) {
                    return res.json({ code: 1, message: 'Sửa thành công' })
                }
                return res.json({ code: 0, message: 'Sửa thất bại' })
            })

    })
    req.on('error', (e) => {
        console.log(e)
    })
})

Router.post('/post/delete/:id', (req, res) => {
    if (!req.params.id) {
        return res.json({ code: 1, message: 'Invalid ID' })
    } else {
        console.log(req.params.id)
        console.log('Đang xoá')
        ContentPost.findByIdAndDelete({ _id: ObjectID(req.params.id) })
            .then(p => {
                if (p) {
                    return res.json({ code: 0, message: 'Xoá thành công' })
                } else {
                    return res.json({ code: 1, message: 'Xoá thất bại' })
                }
            })
    }
})
module.exports = Router

