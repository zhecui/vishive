 var express = require('express');
 var router = express.Router();

router.index = function(req, res){
  res.render('connection', {});
};


router.pca = function(req, res){
  res.render('pca', {});
};

router.ids = function(req, res){
	res.render('ids', {});
}

router.dbscan = function(req, res){
	res.render('dbscan', {});
}

router.wikipedia = function(req, res){
	res.render('wikipedia', {});
}

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'VisHive' });
// });

module.exports = router;
