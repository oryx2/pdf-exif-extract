const electron = require('electron')
const dialog = require('electron').dialog
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const buffer = require('buffer').Buffer
const fs = require('fs')
const os = require('os')

const tmp = os.path.join(os.tmpdir()+'t.foo')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  require('./mainmenu')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

const ipcMain = require('electron').ipcMain
const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool').replace('app.asar', 'app.asar.unpacked')
console.log(exiftoolBin)
const ep = new exiftool.ExiftoolProcess(exiftoolBin)

var f = function(event, file){
  if(!file){
    console.error('no file selected')
    return
  }


  fs.createReadStream(file).pipe(fs.createWriteStream(tmp));
  console.log('copy %s to %s', file, tmp)
  ep
      .open()
      .then(() => ep.readMetadata(tmp, ['Title', 'Author']))
      .then((res) => {
          console.log(res)
          var title = res['data'][0]['Title']
          event.sender.send('open-file-reply', [title, file])
      })
      .then(() => ep.close())
      .then(() => console.log('Closed exiftool'))
      .catch(console.error)
}
ipcMain.on('open-file', (event, file) => {
   f(event, file)
})
ipcMain.on('change', (event, args) => {
  console.log(args)
  var title = args[0]
  var file = args[1]
  const metadata = {
    Title: title
  }
  ep
    .open()
    // use codedcharacterset
    .then(() => ep.writeMetadata(tmp, metadata, ['codedcharacterset=utf8']))
    .then((res)=> {
      fs.createReadStream(tmp).pipe(fs.createWriteStream(file))
      // fs.truncate(tmp)
      event.sender.send('change-finish')
    }, console.error)
    .then(() => ep.close())
    .catch(console.error)
})

ipcMain.on('open-dialog',(event) => {
  dialog.showOpenDialog({ properties: [ 'openFile'], filters: []}, function(files){
    if(files&&files.length>0){
      f(event, files[0])
    }
  });
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
