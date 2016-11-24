var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var child_process = require('child_process');
var express = require('express');

function _generateTestFile(options) {
    var template = fs.readFileSync(path.join('./node_modules', 'uiunit', 'index.ejs'), 'utf8');
    var allArgs = options.folders;
    var lastArgs = allArgs[allArgs.length - 1];
    var public_folder = path.join(process.cwd(), lastArgs.public);

    //Instrument code if required
    var instrumented_scripts;
    if (options.instrument) {
        instrumented_scripts = path.join('temp', 'instrumented_scripts');
        var abs = path.join(public_folder, instrumented_scripts);
        if (fs.existsSync(abs)) _deleteRecursive(abs);
        allArgs.forEach(function (f) {
            var scripts = f.scripts;
            scripts.forEach(function (s) {
                child_process.execSync(path.join('node_modules', '.bin', 'istanbul') + ' instrument "' + path.dirname(path.join(process.cwd(), f.public, s)) + '" --output "' + path.dirname(path.join(abs, s)) + '"');
            });
        });
    }

    var temp_folder = path.join(public_folder, 'temp');
    if (!fs.existsSync(temp_folder)) {
        fs.mkdirSync(temp_folder);
    }

    var libs = [];
    var scripts = [];
    var tests = [];

    allArgs.forEach(function (args) {
        libs = libs.concat(_getFiles(path.join(process.cwd(), args.public), args.libs));
        scripts = scripts.concat(options.instrument ? _getFiles(public_folder, args.scripts.map(function (f) { return path.join(instrumented_scripts, f); })) : _getFiles(path.join(process.cwd(), args.public), args.scripts)),
            tests = tests.concat(_getFiles(path.join(process.cwd(), args.public), args.tests))
    });

    fs.writeFileSync(path.join(public_folder, 'temp', 'index.html'), ejs.render(template, {
        libs: libs,
        scripts: scripts,
        tests: tests
    }));
}

function _generateReports(args) {
    var opts = args.folders[args.folders.length - 1];
    var public_folder = path.join(process.cwd(), opts.public);
    var mount = opts.mount;
    var reports_folder = path.join(public_folder, mount, args.reports);
    var coverage_format = 'html';
    var coverage_json_directory = './coverage';
    var test_results_file = 'test_results.xml';
    var test_html_page = args.baseurl + '/' + mount + '/temp/index.html';

    //Run tests
    _createServer({
        port: '',
        callback: function () {
            child_process.execSync(path.join('node_modules', '.bin', 'mocha-phantomjs') + ' -R xunit -f "' + path.join(reports_folder, test_results_file) + '" --hooks mocha-phantomjs-istanbul "' + test_html_page + '" --ignore-ssl-errors=true --ssl-protocol=any');
        }
    });

    //Generate coverage report
    child_process.execSync(path.join('node_modules', '.bin', 'istanbul') + ' report --root "' + coverage_json_directory + '" --dir "' + path.join(reports_folder, 'coverage') + '" ' + coverage_format);
}

function _createServer(args) {
    var app = express();
    app.use(express.static(path.join(process.cwd(), 'uiunit', 'public')));
    var server = app.listen(args.port, function () {
        console.log('UIUnit Server started!!!');
        args.callback && args.callback() && console.log('Callback completed.');
        console.log('Closing Server.');
        server.close();
    });
}

var _getFiles = function (base, paths) {
    var files = [];
    paths.forEach(function (p) {
        try {
            var s = fs.lstatSync(path.join(base, p));
            if (s.isDirectory()) {
                files = files.concat(_getFilesRecursive(base, p));
            } else if (s.isFile()) {
                files.push(path.relative(base, p).replace(/\\/g, '/'));
            }
        }
        catch (e) {
        }
    });

    return files;
}

var _getFilesRecursive = function (base, dir) {
    var files = [];

    try {
        var contents = fs.readdirSync(path.join(base, dir));
        contents.forEach(function (file) {
            var filePath = path.join(base, dir, file);
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                files = files.concat(_getFilesRecursive(base, path.join(dir, file)));
            } else {
                files.push(path.relative(base, path.join(dir, file)).replace(/\\/g, '/'));
            }
        });
    }
    catch (e) {
    }

    return files;
}

var _deleteRecursive = function (p) {
    if (fs.existsSync(p)) {
        if (fs.lstatSync(p).isDirectory()) { // recurse
            fs.readdirSync(p).forEach(function (file, index) {
                var curPath = p + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    _deleteRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(p);
        } else {
            fs.unlinkSync(p);
        }
    }
};

exports.generateTestFile = _generateTestFile;
exports.generateReports = _generateReports;
exports.createServer = _createServer;