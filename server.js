const PORT = process.env.PORT ?? 8000
const express = require('express')
const {v4: uuidv4} = require('uuid')
const app = express()
const pool = require('./db')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const ejsLayouts = require('express-ejs-layouts')
const fileUpload = require('express-fileupload')
const path = require('path')
const fs = require('fs')

app.use(cors())
app.use(express.json())

app.use(fileUpload())
app.set('view engine', 'ejs')
app.use(ejsLayouts)
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

// Создаем хранилище для загруженных файлов
app.get('/images/:userEmail', async(req, res) => {
  const {userEmail} = req.params
  console.log(userEmail)

  try {
    const pathFromDB = await pool.query('SELECT path FROM photos WHERE user_email = $1', [userEmail])
    const pathString = pathFromDB.rows[0]?.path
    if(pathString) {
        res.sendFile(pathString)
        console.log(pathString)
    } else {
      res.status(500)
    //   console.log('error')
    }
  } catch(err) {
    console.error(err)
}

  

})

app.post('/images/:userEmail', async(req, res) => {

    const {userEmail} = req.params
    // console.log(userEmail)
    const file = req.files?.upload
    if(!file) return

    // const filePath = path.join(__dirname, 'public', 'images', `${file.name}`)
    // console.log(filePath)
    const filePath = path.join(__dirname, 'public','images', `${userEmail}`, `${file.name}`)

    try {
        const checkPhoto = await pool.query('SELECT * FROM photos WHERE user_email=$1', [userEmail])

        if(!checkPhoto.rows.length) {

            fs.mkdir(`public/images/${userEmail}`, err => {
                if(err) console.log(err)
            })

            const newPhoto = await pool.query('INSERT INTO photos(user_email, path) VALUES($1, $2)',[userEmail, filePath])
        } else {

            const oldPhotoPath = checkPhoto.rows[0].path
           // console.log(oldPhotoPath)
            fs.unlink(oldPhotoPath, function(){})
            const newPhoto = await pool.query('UPDATE photos SET path = $1 WHERE user_email = $2', [filePath, userEmail])
        }

    } catch (err) {
        console.error(err)
    }

    file.mv(filePath, err => {
        if (err) {
          console.log('error')
          return res.status(500).send(err)
        }
        res.sendFile(filePath)
        console.log(filePath)
    })
    
  })

  



//get all links
app.get('/links/:userEmail', async(req, res) => {

    
    const {userEmail} = req.params

    try{
        const links = await pool.query('SELECT * FROM link WHERE user_email = $1', [userEmail])
        res.json(links.rows)
        // console.log(todos.rows)

    }
    catch(e) {
        console.error(e)
    }
})

// create and update link's cards
app.post('/links', async(req, res) => {
    
    const linksArr = req.body

    try {
    
        for(let linkIndex = 0; linkIndex < linksArr.length; linkIndex++) {

            let linkObj = linksArr[linkIndex];


            if (linkObj.id.length <= 7) {
                console.log(linkObj)
                const {user_email, title, link, color, text_color, id} = linkObj
                const newId = uuidv4()

                try{
                    const newLink = await pool.query('INSERT INTO link(id, user_email, title, link, color, text_color) VALUES($1, $2, $3, $4, $5, $6)',
                    [newId, user_email, title, link, color, text_color])
                    console.log('added new')

                } catch (e) {
                    console.error(e)
                }

            } 

            else {
                console.log(linkObj)
                const {id, user_email, title, link, color, text_color} = linkObj

                try{
                    const editLink = await pool.query('UPDATE link SET user_email = $1, title = $2, link = $3, color = $4, text_color = $5 WHERE id = $6', 
                    [user_email, title, link, color, text_color, id])
            
                    console.log('updated old')


                } catch (e) {
                    console.error(e)
                }

            } 
        }
        
        res.json('ok')
    } catch(err) {
        console.error(err)
    }

   

})




// // delete link
app.delete('/links/:id', async(req, res) => {

    const {id} = req.params;
   
    try {
        const deleteLink = await pool.query('DELETE FROM link WHERE id = $1;', [id])
        res.json(deleteLink)

    } catch (err) {
        console.error(err)
    }
})

//sign up
app.post('/signup', async(req, res) => {
    const {email, password} = req.body
    console.log(email, password)
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)
    try{

        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if(checkUser.rows.length) return res.json({detail: 'Такой пользователь уже существует'})
        
        const signUp = await pool.query('INSERT INTO users (email, hashed_password) VALUES($1, $2)', [email, hashedPassword])
        const token =  jwt.sign({email}, 'secret', {expiresIn: '1hr'})
        console.log(token)
        res.json({email, token})

    } catch(e) {
        console.error(e)
        if(e) {
            res.json({detail: err.detail})
        }
    }
})

//login
app.post('/login', async(req, res) => {
    const {email, password} = req.body
    const token =  jwt.sign({email}, 'secret', {expiresIn: '1hr'})


    try{

        const user = await pool.query('SELECT * FROM users WHERE email=$1', [email])
        if(!user.rows.length) res.json({detail: "Такого пользователя не существует"})
        else {
            const oldHashedPassword = await user.rows[0].hashed_password
            
            const match = await bcrypt.compare(password, oldHashedPassword)

            if(match) {
                res.json({email, token})
            } else {
                res.json({detail: 'Неверный пароль'})
            }
        }
        
    } catch(e) {
        console.error(e)
    }
})


app.listen(PORT, ()=> console.log(`Server running on PORT ${PORT}`))
