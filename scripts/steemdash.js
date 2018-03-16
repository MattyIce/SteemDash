$(function () {
  var steem_per_mvests = 0;
  var last_trans = 0;
  var first_load = true;
  var trans_types = ['transfer', 'fill_order', 'producer_reward', 'claim_reward_balance'];
  var account_name = getURLParameter('account');

  update();
  setInterval(update, 10000);

  $('#account_name').text('@' + account_name);

  function update() {
    steem.api.getAccounts([account_name], function (e, r) {
      if (r) {
        var account = r[0];
        loadWallet(account);
        loadTransactions(account);
      }
    });
  }

  function loadWallet(account) {
    var vests = parseFloat(account.vesting_shares);

    steem.api.getDynamicGlobalProperties(function (e, t) {
      var tVFS = t.total_vesting_fund_steem.replace(' STEEM', '');
      var tVS = t.total_vesting_shares.replace(' VESTS', '');
      steem_per_mvests = ((tVFS / tVS) * 1000000);

      if (first_load) {
        new Odometer({ el: document.getElementById('sp'), format: '(,ddd).dddddd', theme: 'car' });
        new Odometer({ el: document.getElementById('steem'), format: '(,ddd).ddd', theme: 'car' });
        new Odometer({ el: document.getElementById('sbd'), format: '(,ddd).ddd', theme: 'car' });
        first_load = false;
      }

      $('#sp').text(vests / 1000000 * steem_per_mvests);
      $('#steem').text(parseFloat(account.balance));
      $('#sbd').text(parseFloat(account.sbd_balance));

      var bar = $('#vp div');
      var power = getVotingPower(account) / 100;
      bar.attr('aria-valuenow', power);
      bar.css('width', power + '%');
      bar.text(power + '%');
    });
  }

  function loadTransactions(account) {
    var table = $('#transaction_table tbody');

    steem.api.getAccountHistory(account.name, -1, first_load ? 100 : 50, function (err, result) {
      if (err) return;

      for(var i = 0; i < result.length; i++) {
        var trans = result[i];
        var op = trans[1].op;
        var ts = new Date((trans[1].timestamp) + 'Z');
        
        if (trans_types.indexOf(op[0]) >= 0 && trans[0] > last_trans) {
          console.log('trans[0]: ' + trans[0] + ', last_trans: ' + last_trans);
          var row = $(document.createElement('tr'));

          var cell = $(document.createElement('td'));

          var msg = '';
          switch (op[0]) {
            case 'transfer':
              cell.append($('<div class="transaction">' + op[1].from + ' transfer ' + op[1].amount + ' to ' + op[1].to + '</div>'));
              cell.append($('<div class="memo">' + op[1].memo + '</div>'));
              break;
            default:
              cell.text(op[0]);
              break;
          }

          row.append(cell);

          table.prepend(row);
          last_trans = trans[0];
        }        
      }
    });
  }
});