import macros from './macros.sjs'

exports.popup = str `

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
    <div class="dogewand-popup">
      {foo}
      <iframe src="https://localhost:3700"></iframe>
    </div>

    `