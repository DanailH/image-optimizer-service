const url = require('url');
const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('request');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminOptipng = require('imagemin-optipng');
const imageminGifsicle = require('imagemin-gifsicle');
const CONSTS = require('../constants');

const router = express.Router();

const download = (uri, filename, pathToFile, callback) => {
  request.head(uri, function (err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(`${pathToFile}/${filename}`)).on('close', callback);
  });
};

const buildLocationPath = segmentsArr => {
  return segmentsArr.join('/');
}

router.get('/optimize', (req, res) => {
  const imageUrl = new URL(req.query.image);
  const imageHost = imageUrl.host;
  const localImagePath = buildLocationPath([CONSTS.imagesFolder, imageHost]);
  const imageName = imageUrl.pathname.split('/').pop();
  const options = {
    root: path.join(__dirname, '../', localImagePath),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };

  if (!fs.existsSync(localImagePath)) {
    fs.mkdirSync(localImagePath);
  }

  if (!fs.existsSync(`${localImagePath}/${imageName}`)) {
    download(imageUrl.href, imageName, localImagePath, async () => {
      const files = await imagemin([`${localImagePath}/${imageName}`], {
        destination: `${localImagePath}`,
        plugins: [
          imageminJpegtran(),
          imageminOptipng(),
          imageminGifsicle()
        ]
      });

      console.log(files);
    });
  }

  res.sendFile(imageName, options, function (err) {
    if (err) {
      console.log(err)
    } else {
      console.log('Sent:', imageName)
    }
  });
});

module.exports = router;
