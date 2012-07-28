#!/bin/bash
# setup variables
CLOSURE="/Library/WebServer/Documents/mudcu.be/inc/closure.jar"
UGLIFY="/Library/WebServer/Documents/xGithub/UglifyJS/bin/uglifyjs";
ROOT="/Library/WebServer/Documents/xGithub/Event.js/js/Event"
JSDIR="$ROOT/.."
JSCOMPILE="$JSDIR/Event.min.js"
JSRAW="$JSDIR/Event.js"
# read user input
rm $JSCOMPILE
rm $JSRAW
find $JSDIR -name '*.js' -print0 | while read -d $'\0' file
	do 
		cat $file >> $JSRAW
		echo -e "\r\r\r" >> $JSRAW
	done
# closure
echo "Running the scripts through closure compiler...";
java -jar $CLOSURE --js $JSRAW --js_output_file $JSCOMPILE
# uglify
echo "Running the scripts through uglifyjs...";
node $UGLIFY -o $JSCOMPILE $JSCOMPILE