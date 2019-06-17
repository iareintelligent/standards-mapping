﻿
var Excel = require('exceljs');


var inputFile = "./src/app/data/notcheckedin/MSFT ISO 27552 Country Mapping - Merged.xlsx";
var inputFileGdpr = "./src/app/data/notcheckedin/27552 to GDPR.xlsx";
var outputFile = "./src/app/data/sampledb.json";

var keepNWords = function (input, n) {
    var frags = input.split(" ");
    var result = frags.slice(0, n).join(" ");
    if (frags.length > n)
      result += "...";
    return result;
    //return input.replace(new RegExp("(([^\s]+\s\s*){" + n + "})(.*)"),"$1…");
}

var reduceDoc = function(doc) {
    var result = { };
    for (var i = 0; i < doc.length; ++i)
    {
      var newCell = doc[i];

      var copywriteWordLimit = 25;
      newCell.body = keepNWords(newCell.body, copywriteWordLimit);

      if (newCell.id in result)
      {
        var lastCell = result[newCell.id];

        //console.log("merge: " + newCell.id);
        //console.log("with: " + lastCell.id);
        // merge
        if (!lastCell.body.includes(newCell.body))
        {
            // append body
            lastCell.body += ' \n' + newCell.body;
        }

        mergeLinks(newCell, lastCell);
      }
      else
      {
          result[newCell.id] = newCell;
      }
    }


    var keys = Object.keys(result).sort();
    var objs = keys.map(v => result[v]);
    return objs;
}

var mergeLinks = function (src, dst) {
    if (src.links)
    {
      if (!dst.links)
        dst.links = [];

      for (var l of src.links)
      {
          if (!dst.links.find(n => n.id == l.id && n.type == l.type))
          {
              dst.links.push(l);
          }
      }
        }
}


var breakPath = function (path) {
    if (!path)
      return [];

    var frags = path.split(/\W+/);
    frags = frags.filter(f => f);
    return frags;
}

var normalizePath = function (path) {
    var frags = breakPath(path);
    var assembled = frags.join(".");
    return assembled;
}

var findOrCreateSection = function (root, id) {
  var frags = breakPath(id);
  var assembled = "";

  for (var f of frags)
  {
      if (assembled.length)
        assembled += '.';
      assembled += f;

      var child = root.children ? root.children.find(c => c.id == assembled) : null;
      if (child)
        root = child;
      else
      {
          var node = { 
            "id": assembled,
            "frag": f, // sortable fragment
            "section": assembled,
            "children": [],
            "links": []
          };

          root.children.push(node);
          root = node;
      }
  }

  return root;
}

var recursiveSort = function (doc) {
    doc.children.sort((a,b) => {
      if (!isNaN(a.frag) && !isNaN(b.frag))
        return parseInt(a.frag) - parseInt(b.frag);

      return a.frag - b.frag;
    });

    for (var c of doc.children)
      recursiveSort(c);
}

var nestDoc = function (doc) {
    var result = { "children" : [] };

    mergeDoc(doc, result);

    return result;
}



var mergeDocRecursive = function (src, dst) {
    for (var d of src)
    {
        var node = findOrCreateSection(dst, d.id);

        // copy properties
        node.id = d.id;
        node.section = d.section;
        node.body = d.body;
        if (d.links)
          mergeLinks(d, node);

        if (d.children)
          mergeDocRecursive(d.children, dst);
    }
}

var mergeDoc = function (src, dst) {
    mergeDocRecursive(src, dst);

    recursiveSort(dst);

    return dst;
}

var makeDoc = function (doc, type) {
    doc.type = type;
    doc.rev = 1;
    return doc;
}

var mainMapping = function() {
  // read from a file
  var workbook = new Excel.Workbook();
  return workbook.xlsx.readFile(inputFile)
    .then(function() {
        // use workbook
        var sheetName = 'ISO 27552 Country Mapping';
        var worksheet = workbook.getWorksheet(sheetName);

        // build iso doc
        var sectionColumn = worksheet.getColumn(1);
        var sectionsByRow = { };

        sectionColumn.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
          var section = cell.text.match(/(\d.*)/); // must start with a number
          if (section)
          {
            sectionsByRow[rowNumber] = normalizePath(section[1])
          }
        });

        var allDocs = [];
        var isoDoc = [];
        var descriptionColumn = worksheet.getColumn(2);
        descriptionColumn.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
          var section = sectionsByRow[rowNumber];
          if (section)
          {
            isoDoc.push({
                id: section,
                section: section,
                body: cell.text
            });
          }
        });

        isoDoc = makeDoc(nestDoc(reduceDoc(isoDoc)), "ISO");
        //console.log(JSON.stringify(isoDoc, null, 4));
        allDocs.push(isoDoc);





        var headerRow = worksheet.getRow(1);
        headerRow.eachCell(function(cell, colNumber) {
          if (colNumber <= 2)
            return; // skip iso columns.

          console.log('Header ' + colNumber + ' = ' + cell.text);
        
          var newDoc = [];
        
          var sectionColumn = worksheet.getColumn(colNumber);
          sectionColumn.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
            var section = cell.text.match(/.*\((.*)\).*/);
            if (section)
            {
              var normalized = normalizePath(section[1]);
              var isoSection = sectionsByRow[rowNumber];
              newDoc.push({
                  id: normalized,
                  section: normalized,
                  body: cell.text,
                  links: [ {
                      "id": isoSection,
                      "type": "ISO"
                    }
                  ]
              });
            }
          });

          newDoc = makeDoc(nestDoc(reduceDoc(newDoc)), cell.text);
          //console.log(JSON.stringify(newDoc, null, 4));
          allDocs.push(newDoc);
        });
        //console.log(JSON.stringify(worksheet.rowCount));
        
        return allDocs;
    });
}


var gdprMapping = function() {
  // read from a file
  var workbook = new Excel.Workbook();
  return workbook.xlsx.readFile(inputFileGdpr)
    .then(function() {
        // use workbook
        var sheetName = 'Sheet1';
        var worksheet = workbook.getWorksheet(sheetName);

        // build iso doc
        var sectionColumn = worksheet.getColumn(1);
        var sectionsByRow = { };

        var allDocs = [];
        var isoDoc = [];
        var gdprDoc = [];

        var gdprArticlesColIndex = 2;
        var gdprTextColIndex = 3;
        var titleColIndex = 4;
        var descriptionColIndex = 5;

        sectionColumn.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
          var section = cell.text.match(/(\d.*)/); // must start with a number
          if (section)
          {
            var sectionId = normalizePath(section[1]);
            sectionsByRow[rowNumber] = sectionId;

            var row = worksheet.getRow(rowNumber);
            var gdprIds = row.getCell(gdprArticlesColIndex).text.split(",").map(v => v.match(/(\w+)*/g).filter(m => m).join("."));
            var gdprText = row.getCell(gdprTextColIndex).text.split("\r\n\r\n");

            var gdprZipped = gdprIds.map((v, i, a) => {
                return {
                    id: v,
                    section: v,
                    body: gdprText[i],
                    links: [ {
                        "id": sectionId,
                        "type": "ISO"
                      }
                    ]
                }
            });

            gdprDoc = gdprDoc.concat(gdprZipped);

            isoDoc.push({
                id: sectionId,
                section: sectionId + " - " + row.getCell(titleColIndex).text,
                body: row.getCell(descriptionColIndex).text
            });
          }
        });

        isoDoc = makeDoc(nestDoc(reduceDoc(isoDoc)), "ISO");
        gdprDoc = makeDoc(nestDoc(reduceDoc(gdprDoc)), "GDPR");
        allDocs.push(isoDoc);
        allDocs.push(gdprDoc);

        return allDocs;
    });
}

mainMapping()
  .then(allDocs => {
    
        gdprMapping()
          .then(isoGdpr => {
            var isoDocMain = allDocs[0];
            var isoDocGdpr = isoGdpr[0];
            var gdprDoc = isoGdpr[1];

            allDocs.push(gdprDoc);

            mergeDoc(isoDocGdpr.children, isoDocMain);
    
            console.log(JSON.stringify(allDocs, null, 4));

            const fs = require('fs');
            let data = JSON.stringify(allDocs, null, 4);  
            fs.writeFileSync(outputFile, data); 
        });
  });