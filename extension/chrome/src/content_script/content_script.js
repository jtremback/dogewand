var templates = {
  popup: str `

    <style>
      .dogewand-popup {
        top: 0;
        right: 0;
        position: fixed;
        z-index: 3000000;
        height: 300px;
        width: 300px;
      }
    </style>
    <iframe src="https://localhost:3700" id="dogewand-popup"></iframe>

    `
}

var popup = document.createElement('div');
popup.innerHTML = templates.popup;
document.body.appendChild(popup);
