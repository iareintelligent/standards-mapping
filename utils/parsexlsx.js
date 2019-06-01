
var Excel = require('exceljs');


var inputFile = "./src/app/data/notcheckedin/MSFT ISO 27552 Country Mapping.xlsx";
var outputFile = "./src/app/data/sampledb.json";

var keepNWords = function (input, n) {
    return input.replace(new RegExp("(([^\s]+\s\s*){" + n + "})(.*)"),"$1…");
}

var reduceDoc = function(doc) {
    var result = { };
    for (var i = 0; i < doc.length; ++i)
    {
      var newCell = doc[i];

      var copywriteWordLimit = 25;
      newCell.body = keepNWords(newCell.body, copywriteWordLimit);

      if (newCell.section in result)
      {
        var lastCell = result[newCell.section];

        //console.log("merge: " + newCell.section);
        //console.log("with: " + lastCell.section);
        // merge
        if (!lastCell.body.includes(newCell.body))
        {
            // append body
            lastCell.body += ' \n' + newCell.body;
        }

        // merge links
        if (newCell.links)
        {
          if (!lastCell.links)
            lastCell.links = [];

          for (var l of newCell.links)
          {
              if (!lastCell.links.find(n => n.id == l.id && n.type == l.type))
              {
                  lastCell.links.push(l);
              }
          }
        }
      }
      else
      {
          result[newCell.section] = newCell;
      }
    }


    var keys = Object.keys(result).sort();
    var objs = keys.map(v => result[v]);
    return objs;
}

var nestDocRecursive = function (doc, prefix, result, index) {

    if (result.children == null)
      result.children = [];

    for (; index < doc.length; ++index)
    {
      var node = doc[index];

      if (prefix == null || node.section.startsWith(prefix))
      {
          //console.log("Push: " + node.section);
          result.children.push(node);
          index = nestDocRecursive(doc, node.section, node, index + 1);
      }
      else
      {
          //console.log("Break: " + node.section);
          return index - 1;
      }
    }

    return index;
}

var nestDoc = function (doc) {
    var result = {};
    var prefix = null;
    var index = 0;

    nestDocRecursive(doc, prefix, result, index);

    return result;
}

var makeDoc = function (doc, type) {
    doc.type = type;
    doc.rev = 1;
    return doc;
}

// read from a file
var workbook = new Excel.Workbook();
workbook.xlsx.readFile(inputFile)
    .then(function() {
        // use workbook
        var sheetName = 'ISO 27552 Country Mapping';
        var worksheet = workbook.getWorksheet(sheetName);
        
        //var sectionColumn = worksheet.getColumn(1);
        //console.log(JSON.stringify(sectionColumn.values)); //.header
        //console.log(JSON.stringify(worksheet.columns.map(v=>v.values[1]))); //.header
        
        //// iterate over all current cells in this column including empty cells
        //dobCol.eachCell({ includeEmpty: true }, function(cell, rowNumber) { cell.value
        //  // ...
        //  type: 'pattern',
        //  pattern:'darkTrellis',
        //  fgColor:{argb:'FFFFFF00'},
        //  bgColor:{argb:'FF0000FF'}
        //};
        //});

        // build iso doc
        var sectionColumn = worksheet.getColumn(1);
        var sectionsByRow = { };

        sectionColumn.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
          var section = cell.text.match(/(\d.*)/); // must start with a number
          if (section)
          {
            sectionsByRow[rowNumber] = section[1]
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
              var isoSection = sectionsByRow[rowNumber];
              newDoc.push({
                  id: section[1],
                  section: section[1],
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

        console.log(JSON.stringify(allDocs, null, 4));

        const fs = require('fs');
        let data = JSON.stringify(allDocs, null, 4);  
        fs.writeFileSync(outputFile, data);  
    });