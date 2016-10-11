var fs = require('fs');
var path = require('path');

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

var getFilesRecursive = function(base, dir){
	var files = [];	
	var contents = fs.readdirSync(path.join(base, dir));

	contents.forEach(function(file){
		var filePath = path.join(base, dir, file);
		var stat = fs.statSync(filePath);
		if(stat.isDirectory()){
			files = files.concat(getFilesRecursive(base, path.join(dir, file)));
		}else{
			files.push(path.relative(base, path.join(dir, file)).replace(/\\/g,'/'));
		}
	});

	return files;
}

exports.index = __runTests;