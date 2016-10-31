// =======================
// get the packages we need ============
// =======================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var cors = require('cors');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./app/models/user'); // get our mongoose model
var Article = require('./app/models/article');
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// use morgan to log requests to the console
app.use(morgan('dev'));

var apiRoutes = express.Router();

// var token = jwt.sign({ foo: 'bar' }, 'ourfirstnewsblog');
// console.log(token);
apiRoutes.use(function (req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});
apiRoutes.get('/articles', function (req, res) {
    Article.find()
    .populate('createdBy')
    .exec(function (err, articles) {
      res.json(articles);
    })
});
apiRoutes.post('/articles', function (req, res) {
    var newArticle = new Article({
        caption: req.body.caption,
        description: req.body.description,
        createdBy: req.body.createdBy,
        picture: req.body.picture,
    });
    newArticle.save(function (err) {
        if (err) throw err;
        console.log('Article saved successfully');
        res.json({ success: true });
    });
});
apiRoutes.get('/users', function (req, res) {
    User.find()
    .populate('article')
    .exec(function (err, users) {
        res.json(users);
    }) 
});
apiRoutes.post('/users', function (req, res) {
    var newUser = new User({
        email: req.body.email,
        password: req.body.password,
        admin: req.body.admin
    });
    newUser.save(function (err) {
        if (err) throw err;
        console.log('User saved successfully');
        res.json({ success: true });
    });
});
apiRoutes.post('/authenticate', function (req, res) {

    // find the user
    User.findOne({
        name: req.body.name
    }, function (err, user) {

        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: 60 * 60 * 24 // expires in 24 hours
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
});


app.use('/api', apiRoutes);

app.listen(port);
