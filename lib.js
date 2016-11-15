var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var child_process = require('child_process');

function _generateTestFile(options) {
	var template = fs.readFileSync('./node_modules/uiunit/index.ejs', 'utf8');
	var public_folder = path.join(process.cwd(), options.folders['public']);
	
	//Instrument code if required
	var instrumented_scripts;
	if(options.instrument){
		instrumented_scripts = path.join(public_folder, '/temp/instrumented_scripts');		
		_deleteFolderRecursive(instrumented_scripts);
		options.folders.scripts.forEach(function(f){
			child_process.execSync(path.join('node_modules', '.bin', 'istanbul') + ' instrument "' + path.join(public_folder, f) + '" --output "' + instrumented_scripts + '"');
		});		
	}
	
	fs.writeFileSync(path.join(public_folder, '/temp/index.html'), ejs.render(template, {
		libs: _getFiles(public_folder, options.folders.libs),
		scripts: _getFiles(public_folder, options.instrument ? instrumented_scripts: options.folders.scripts),
		tests: _getFiles(public_folder, options.folders.tests)
	}));
}

function _generateReports(args){
	var public_folder = path.join(process.cwd(), args['public']);
	var reports_folder = path.join(public_folder, args.reports);
	var coverage_format = 'html';
	var coverage_json_directory = './coverage';
	var test_results_file = 'test_results.xml';
	var test_html_page = args.baseurl + '/temp/index.html';

	_generateTestFile({
		instrument: true,
		folders: {
			"public": args['public'],
			"libs": args.libs,
			"scripts": args.scripts,
			"tests": args.tests
		}
	});

	//Run tests
	child_process.execSync(path.join('node_modules', '.bin', 'mocha-phantomjs') + ' -R xunit -f "' + path.join(reports_folder, test_results_file) + '" --hooks mocha-phantomjs-istanbul "' + test_html_page + '" --ignore-ssl-errors=true --ssl-protocol=any');

	//Generate coverage report
	child_process.execSync(path.join('node_modules', '.bin', 'istanbul') + ' report --root "' + coverage_json_directory + '" --dir "' + path.join(reports_folder, 'coverage') + '" ' + coverage_format);

	_deleteFolderRecursive(path.join(public_folder, 'temp'));
}

var _getFiles = function(base, paths){
	var files = [];
	paths.forEach(function(p){
		var s = fs.lstatSync(p);
		if(s.isDirectory()){
			files.concat(_getFilesRecursive(base, p));
		}else if(s.isFile()){
			files.push(p);
		}
	});

	return files;
}

var _getFilesRecursive = function(base, dir){	
	var files = [];	

	try{
		var contents = fs.readdirSync(path.join(base, dir));
		contents.forEach(function(file){
			var filePath = path.join(base, dir, file);
			var stat = fs.statSync(filePath);
			if(stat.isDirectory()){
				files = files.concat(_getFilesRecursive(base, path.join(dir, file)));
			}else{
				files.push(path.relative(base, path.join(dir, file)).replace(/\\/g,'/'));
			}
		});
	}
	catch(e){		
	}	

	return files;
}

var _deleteFolderRecursive = function(p) {
  if( fs.existsSync(p) ) {
    fs.readdirSync(p).forEach(function(file,index){
      var curPath = p + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        _deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(p);
  }
};

exports.generateTestFile = _generateTestFile;
exports.generateReports = _generateReports;