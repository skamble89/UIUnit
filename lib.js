var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var child_process = require('child_process');

function _generateTestFile(options) {
	//Instrument code if required
	if(options.instrument)	
		child_process.execSync('node_modules\\.bin\\istanbul instrument "' + options.folders.scripts + '" --output "' + path.join(options.folders.scripts, '../', 'temp', 'instrumented_scripts') + '"');

	var template = fs.readFileSync('./node_modules/uiunit/index.ejs', 'utf8');
	fs.writeFileSync(path.join(process.cwd(), '/public/temp/index.html'), ejs.render(template, {
		libs: _getFilesRecursive(options.folders.libs),
		scripts: _getFilesRecursive(options.instrument? path.join(options.folders.scripts, '../', 'temp', 'instrumented_scripts'): options.folders.scripts),
		tests: _getFilesRecursive(options.folders.tests)
	}));
}

/*
var __runTests = function(req, res){	
	var scriptsBase = path.join(__dirname, '../../../server/site/public/');
	var scriptsInstrumented = directoryExists(path.join(scriptsBase, 'instrumented_scripts'));

	var scripts = getFilesRecursive(scriptsBase, scriptsInstrumented ? 'instrumented_scripts': 'javascripts/code/');	
	var tests = getFilesRecursive(scriptsBase, '/tests');

	res.render('./index.ejs', {
		libs: [],
		scripts: [],
		tests: []
	});
}

var directoryExists = function(dir){
	try{		
		fs.accessSync(dir);		
		return true;
	}
	catch(e){
		return false;
	}
}
*/
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
/*
exports.index = __runTests;
*/
exports.generateTestFile = _generateTestFile;