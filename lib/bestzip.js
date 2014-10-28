// creates a zip file using either the native `zip` command if avaliable,
// or a node.js zip implimentation otherwise.
//
// currently only supports zipping a single source file/dir

var cp = require('child_process');
var fs = require('fs');
var pathUtil = require('path');

var archiver = require('archiver');

var NATIVE = 'native';
var NODE = 'node';

var _which = null;

function which(done){
    if (_which) {
        return process.nextTick(done.bind(null, null, _which));
    } else {
        cp.exec('which zip', function(err, path) {
            // this may error on systems where "which" isn't a command. in that case, just use the node zip.
            if (!err && path) {
                _which = NATIVE;
            } else {
                _which = NODE;
            }
            done(null, _which);
        });
    }
}


function nativeZip(dest, source, done) {
    cp.spawn('zip', ['--quiet', '--recurse-paths', dest, source], done);
}

// based on http://stackoverflow.com/questions/15641243/need-to-zip-an-entire-directory-using-node-js/18775083#18775083
function nodeZip(dest, source, done) {
    var zipDest = source;// this "dest" is the filename inside of the zip
    var basename = pathUtil.basename(source);
    if (basename == '*') {
        source = source.substr(0, source.length-1);
        zipDest = '/';
    }

    var output = fs.createWriteStream(dest);
    var archive = archiver('zip');

    output.on('close', done);
    archive.on('error', done);

    archive.pipe(output);
    fs.stat(source, function(err, stats) {
        if (stats.isDirectory()) {
            archive.bulk([
                {expand: true, cwd: source, src: ['**'], dest: zipDest}
            ]);
        } else if (stats.isFile()) {
            archive.file(source, {name: basename, stats: stats});
        }
        archive.finalize();
    });
}

function zip(dest, source, done) {
    which(function(err, which) {
        if (err) {
            done(err);
        }
        if (which == NATIVE) {
            nodeZip(dest, source, done);
        } else {
            nodeZip(dest, source, done);
        }
    });
}


module.exports = zip;
module.exports.zip = zip;
module.exports.nodeZip = nodeZip;
module.exports.nativeZip = nativeZip;
module.exports.bestzip = zip;