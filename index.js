var child_process = require('child_process');
var path = require('path');

var public_folder = path.join(process.cwd(), '/public');
var scripts_folder = path.join(public_folder, '/javascripts');
var instrumented_scripts = path.join(public_folder, '/instrumented_scripts');

var reports_folder = path.join(public_folder, '/reports');
var coverage_format = 'html';

//Instrument code
child_process.execSync('istanbul instrument ' + scripts_folder + ' --output ' + instrumented_scripts);

//Run tests
child_process.execSync('mocha-phantomjs -R xunit -f ' + path.join(reports_folder, 'test_results.xml') + ' --hook mocha-phantomjs-istanbul <test_html_page>');

//Generate coverage report
child_process.execSync('istanbul report --root <coverage_json_directory> --dir ' + path.join(reports_folder, 'coverage') + ' ' + coverage_format);
	