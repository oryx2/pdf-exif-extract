// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer, dialog } = require('electron')

var file

function render(id, content){
    document.getElementById(id).innerHTML = content
}
ipcRenderer.on('open-file-reply', (event, args) => {
    var title = args[0]
    var file = args[1]
    document.getElementById('content').removeAttribute('hidden')
    document.getElementById('title').value = title
    document.getElementById('file').innerHTML = file
})

ipcRenderer.on('change-finish', ()=> {
    alert('修改完成')
})