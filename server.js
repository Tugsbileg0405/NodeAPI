// =======================
// get the packages we need ============
// =======================
var express = require('express'),
    cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./app/models/user'); // get our mongoose model
var Article = require('./app/models/article');
var Common = require('./common');
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable
app.use(cors());
// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
// use morgan to log requests to the console
app.use(morgan('dev'));

var apiRoutes = express.Router();
apiRoutes.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// var token = jwt.sign({ foo: 'bar' }, 'ourfirstnewsblog');
// console.log(token);

function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.send(403);
    }
}

apiRoutes.post('/authenticate', function (req, res) {
    User.findOne({
        email: req.body.email
    }, function (err, user) {
        if (!err) {
            if (user === null) {
                return res.json({
                    success: false,
                    message: "invalid email or password"
                });
            }
            if (req.body.password === Common.decrypt(user.password)) {
                var result = {
                    token: user.token
                };
                return res.json({
                    success: true,
                    message: result
                });
            } else {
                return res.json({
                    success: false,
                    message: "invalid email or password"
                });
            }
        } else {
            res.json({
                success: false,
                message: 'invalid email or password'
            });
        }
    })
});
apiRoutes.post('/users', function (req, res) {
    var encryptedpassword = Common.encrypt(req.body.password);
    var newUser = new User({
        email: req.body.email,
        password: encryptedpassword,
        admin: req.body.admin,
    });
    newUser.save(function (err, user) {
            if (!err) {
                var tokenData = {
                    email: user.email,
                    id: user._id
                };
                var token = jwt.sign(tokenData, config.secret);
                user.token = token;
                user.save(function (err) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.json({
                            success: true
                        });
                    }
                });
            } else {
                return res.json(err); // HTTP 403
            }
        })
        // var newUser = new User({
        //     email: req.body.email,
        //     password: req.body.password,
        //     admin: req.body.admin
        // });
        // newUser.save(function (err) {
        //     if (err) throw err;
        //     console.log('User saved successfully');
        //     res.json({
        //         success: true
        //     });
        // });
});

apiRoutes.get('/me', ensureAuthorized, function (req, res) {
    User.findOne({
        token: req.token
    }, function (err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            res.json({
                type: true,
                data: user
            });
        }
    });
});
// apiRoutes.post('/authenticate', function (req, res) {

//     // find the user
//     User.findOne({
//         email: req.body.email
//     }, function (err, user) {

//         if (err) throw err;

//         if (!user) {
//             res.json({
//                 success: false,
//                 message: 'Authentication failed. User not found.'
//             });
//         } else if (user) {

//             // check if password matches
//             if (user.password != req.body.password) {
//                 res.json({
//                     success: false,
//                     message: 'Authentication failed. Wrong password.'
//                 });
//             } else {

//                 // if user is found and password is right
//                 // create a token
//                 var token = jwt.sign(user, app.get('superSecret'), {
//                     expiresIn: 60 * 60 * 24 // expires in 24 hours
//                 });

//                 // return the information including token as JSON
//                 res.json({
//                     success: true,
//                     message: 'Enjoy your token!',
//                     token: token
//                 });
//             }

//         }

//     });
// });

apiRoutes.use(function (req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
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
apiRoutes.delete('/users/:user_id', function (req, res) {
    User.remove({
        _id: req.params.user_id
    }, function (err, user) {
        if (err)
            res.send(err);

        res.json({
            message: 'Successfully deleted'
        });
    });
});

apiRoutes.get('/articles', function (req, res) {
    Article.find()
        .populate('createdBy')
        .exec(function (err, articles) {
            res.json(articles);
        })
});
apiRoutes.get('/articles/:article_id', function (req, res) {
    Article.findOne({
        _id: req.params.article_id
    }, function (err, article) {
        if (err)
            res.send(err);
        res.json({
            data: article
        });
    });

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
        res.json({
            success: true
        });
    });
});
apiRoutes.get('/users', function (req, res) {
    User.find()
        .populate('article')
        .exec(function (err, users) {
            res.json(users);
        })
});




app.use('/api', apiRoutes);

app.listen(port);