var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var child_process = require('child_process');

function _generateTestFile(options) {
	var template = fs.readFileSync('./node_modules/uiunit/index.ejs', 'utf8');
	var public_folder = path.join(process.cwd(), '/public');
	
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