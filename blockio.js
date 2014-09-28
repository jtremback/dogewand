var BlockIo = require('block_io');
var block_io = new BlockIo('42c9-b458-7867-0e2e');

block_io.get_new_address({ label: 'shat' }, function (err, result) {
  console.log(err)
});
