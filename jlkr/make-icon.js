const sharp = require("sharp");
sharp("icon.svg")
  .resize(768, 1024)
  .extend({top: 128, bottom: 128, left: 128, right: 128, background: {r:0,g:0,b:0,alpha:0}})
  .png()
  .toFile("icon-square.png", function(err, info) {
    if (err) { console.error(err); process.exit(1); }
    else { console.log("Done:", JSON.stringify(info)); }
  });
