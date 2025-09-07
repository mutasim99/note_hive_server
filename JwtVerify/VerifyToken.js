const jwt = require('jsonwebtoken');
const verifyToken = (req, res, next) => {
    // console.log('inside the middleware', req.headers.authorization);
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized' })
    }
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).send({ message: 'unauthorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err,decoded)=>{
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
    
}

module.exports = { verifyToken }