var form = document.getElementById('tipper-form');
form.addEventListener('submit', function(e){
    e.preventDefault();

    parent.postMessage('close', '*');
});