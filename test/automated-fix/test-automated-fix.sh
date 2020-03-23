#!/bin/bash

cp -r cases cases-backup

(cd ../.. && npx tslint -c test/automated-fix/tslint.json test/automated-fix/cases/*.ts --fix)

DIFF=$(diff -bur cases expected)
rm -r cases
mv cases-backup cases

if [ -z "$DIFF" ]; then
  exit 0
else
  echo "Diff is not empty. The test did not pass"
  echo "$DIFF"
  exit 1
fi
