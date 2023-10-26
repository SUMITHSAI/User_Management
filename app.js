//Reference
//https://theonlytutorials.com/node-js-express-crud-example-storing-data-in-json-file/

const express = require('express')
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const fs = require('fs')

const app = express()
//this line is required to parse the request body
app.use(express.json())

const secretToken = '59b43148-6155-4a23-9755-130ac16df515';

/* Health Check - Get method */
app.get('/api/healthcheck', (req, res) => {
    res.send({success: true, msg: 'Server is up and running!'})
})

/* SignUp - POST method */
app.post('/api/signup', (req, res) => {
    //get the new user data from post request
    const userData = req.body

    //get the existing user data
    const existUsers = getUserData()

    // https://www.abstractapi.com/guides/email-validation-regex-javascript
    let regex = new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/, "gm");

    const validateEmail = (userData.email !== '' &&  regex.test(userData.email)) ? true : false;

    if(!validateEmail) {
        return res.status(401).send({error: true, msg: 'Please enter a valid Email'})
    }

    if(userData.name == null || userData.name == "") {
        return res.status(401).send({error: true, msg: 'Please enter a valid name'})
    }

    if(userData.password == null || userData.password == "") {
        return res.status(401).send({error: true, msg: 'Please enter a valid password'})
    }

    //check if the name exist already
    const findExist = existUsers.find( user => user.email === userData.email )
    if (findExist) {
        return res.status(409).send({error: true, msg: 'User already exist'})
    }

    const unique = Math.floor(new Date().getTime() / 1000)

    userData.id = crypto.randomUUID();
    userData.creationTimeStamp = unique;

    //append the user data
    existUsers.push(userData)
    //save the new user data
    saveUserData(existUsers);
    res.send({success: true, msg: 'User signup successfully'})
})

/* Read - GET method */
app.post('/api/login', (req, res) => {
    const userData = req.body
    const existUsers = getUserData()

    //check if the name exist already
    const user = existUsers.find( user => user.email === userData.email && user.password === userData.password)
    if (!user) {
        return res.status(409).send({error: true, msg: 'Please enter valid username and password'})
    }

    var token = jwt.sign({ id: user.id, email: user.email }, secretToken, {
        expiresIn: 86400 // expires in 24 hours
    });

    res.send({success: true, token: token, msg: 'User login successfully'})
})

/* Read - GET method */
app.get('/api/users', (req, res) => {
    if(!isValidToken(req)) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    
    const users = getUserData()
    res.send(users)
})

/* Read - GET method */
app.get('/api/user/:id', (req, res) => {
    if(!isValidToken(req)) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    const id = req.params.id;
    const existUsers = getUserData()

    //check if the name exist already
    const filterUser = existUsers.filter(user => user.id.toString() === id)

    if (filterUser.length == 0) {
        return res.status(409).send({error: true, msg: 'User does not exist'})
    }

    res.send(filterUser);
})

/* Read - GET method */
app.get('/api/users/:hours', (req, res) => {
    if(!isValidToken(req)) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    const hours = req.params.hours;
    const existUsers = getUserData()

    const currentTime = Math.floor(new Date().getTime() / 1000)
    const hoursInSeconds = hours * 60 * 60
    const timeDiff = currentTime - hoursInSeconds;

    const filterUser = existUsers.filter(user => user.creationTimeStamp >= timeDiff);

    res.send(filterUser);
})

/* Delete - Delete method */
app.delete('/api/user/:id', (req, res) => {
    if(!isValidToken(req)) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

    const id = req.params.id
    //get the existing userdata
    const existUsers = getUserData()
    //filter the userdata to remove it
    const filterUser = existUsers.filter( user => user.id.toString() != id)
    if ( existUsers.length === filterUser.length ) {
        return res.status(409).send({error: true, msg: 'user does not exist'})
    }

    //save the filtered data
    saveUserData(filterUser)
    res.send({success: true, msg: 'User removed successfully'})    
})

const isValidToken = (req) => {
    var token = req.headers['x-access-token'];
    if (!token) return false;
    
    try {
        const decoded = jwt.verify(token, secretToken);

        if(decoded) {
            const existUsers = getUserData();
            const filterUser = existUsers.filter(user => user.id.toString() === decoded.id && user.email === decoded.email)
        
            if (filterUser.length > 0) {
                return true;
            }
        }    
    } catch (e) {
    }

    return false;
}

/* util functions */
//read the user data from json file
const saveUserData = (data) => {
    const stringifyData = JSON.stringify(data)
    fs.writeFileSync('users.json', stringifyData)
}
//get the user data from json file
const getUserData = () => {
    const jsonData = fs.readFileSync('users.json')
    return JSON.parse(jsonData)    
}
/* util functions ends */
//configure the server port
app.listen(3000, () => {
    console.log('Server runs on port 3000')
})