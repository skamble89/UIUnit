var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var child_process = require('child_process');

function _generateTestFile(options) {
	var template = fs.readFileSync('./node_modules/uiunit/index.ejs', 'utf8');
	var public_folder = path.join(process.cwd(), options.folders.public);
	
	//Instrument code if required
	var instrumented_scripts;
	if(options.instrument){
		instrumented_scripts = '/temp/instrumented_scripts';		
		child_process.execSync('node_modules\\.bin\\istanbul instrument "' + path.join(public_folder, options.folders.scripts) + '" --output "' + path.join(public_folder, instrumented_scripts) + '"');
	}
	
	fs.writeFileSync(path.join(process.cwd(), '/public/temp/index.html'), ejs.render(template, {
		libs: _getFilesRecursive(public_folder, options.folders.libs),
		scripts: _getFilesRecursive(public_folder, options.instrument? instrumented_scripts: options.folders.scripts),
		tests: _getFilesRecursive(public_folder, options.folders.tests)
	}));
}

function _generateCoverage(args){
	var public_folder = path.join(process.cwd(), args.public);
	var reports_folder = path.join(public_folder, args.reports);
	var coverage_format = 'html';
	var coverage_json_directory = './coverage';
	var test_results_file = 'test_results.xml';
	var test_html_page = 'http://localhost:3000/temp/index.html';//path.join(public_folder, 'temp/index.html');

	_generateTestFile({
		instrument: true,
		folders: {
			"public": args.public
			"libs": args.libs,
			"scripts": args.scripts,
			"tests": args.tests
		}
	});

	//Run tests
	child_process.execSync('node_modules\\.bin\\mocha-phantomjs -R xunit -f "' + path.join(reports_folder, test_results_file) + '" --hooks mocha-phantomjs-istanbul "' + test_html_page + '" --ignore-ssl-errors=true --ssl-protocol=any');

	//Generate coverage report
	child_process.execSync('node_modules\\.bin\\istanbul report --root "' + coverage_json_directory + '" --dir "' + path.join(reports_folder, 'coverage') + '" ' + coverage_format);
}

var _getFilesRecursive = function(base, dir){	
	var files = [];	
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

	return files;
}

exports.generateTestFile = _generateTestFile;
exports.generateCoverage = _generateCoverage;