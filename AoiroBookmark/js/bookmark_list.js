// vim: ts=2 sw=2 sts=2

// Dropbox app key
var DROPBOX_APP_KEY = '8lwf3rf1hii78nk';

// Exposed for easy access in the browser console.
var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
var authDriver = new Dropbox.AuthDriver.Popup;
authDriver.receiverUrl = "https://dl.dropboxusercontent.com/u/30646000/AoiroToDo/index.html";
client.authDriver(authDriver);
var bookmarkTable;

$(function () {
  // Insert a new bookmark record into the table.
  function insertBookmark(text, inUrl) {
    bookmarkTable.insert({
      bookmarkname: text,
      created: new Date(),
      url: inUrl
    });
  }

  // updateList will be called every time the table changes.
  function updateList() {
    $('#list').empty();

    var records = bookmarkTable.query();

    // Sort by creation time.
    records.sort(function (bookmarkA, bookmarkB) {
      if (bookmarkA.get('created') < bookmarkB.get('created')) return -1;
      if (bookmarkA.get('created') > bookmarkB.get('created')) return 1;
      return 0;
    });

    // Add an item to the list for each bookmark.
    for (var i = 0; i < records.length; i++) {
      var record = records[i];
      $('#bookmarks').append(
        renderBookmark(record.getId(),
          record.get('url'),
          record.get('bookmarkname')));
    }

    addListeners();
    $('#newBookmark').focus();
  }

  client.authenticate({interactive: false}, function(err, cli) {
    if (err) {
      // error
      window.alert('Authentication error: ' + err);
      console.log('Authentication error: ' + err);
    }
  });

  // The login button will start the authentication process.
  $('#loginButton').click(function (e) {
    e.preventDefault();
    if (client.isAuthenticated()) {
      authenticated();
    } else {
      // This will popup the browser to OAuth login.
      client.authenticate();

      // setTimeoutして認証完了をポーリング
//      window.setTimeout(authenticated, 1000);
    }
  });

  function authenticated() {
    if (client.isAuthenticated()) {
      // Client is authenticated. Display UI.
      $('#loginButton').hide();
      $('#main').show();

      client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
        if (error) {
          window.alert('Error opening default datastore: ' + error);
          console.log('Error opening default datastore: ' + error);
        }

        bookmarkTable = datastore.getTable('tasks');

        // Populate the initial bookmark list.
        updateList();

        // Ensure that future changes update the list.
        datastore.recordsChanged.addListener(updateList);
      });
    } else {
      client.authenticate({interactive: false}, function(err, cli) {
        if (err) {
          // error
          window.alert('Authentication error: ' + err);
          console.log('Authentication error: ' + err);
          window.setTimeout(authenticated, 2000);
        }
      });
    }
  }

  // Set the url status of a task with the given ID.
  function setUrl(id, url) {
    bookmarkTable.get(id).set('url', url);
  }

  // Delete the record with a given ID.
  function deleteRecord(id) {
    bookmarkTable.get(id).deleteRecord();
  }

  // Render the HTML for a single bookmark.
  function renderBookmark(id, url, text) {
    return $('<li>').attr('id', id).append(
        $('<button>').addClass('delete').html('&times;')
      ).append(
        $('<span>').append(
          $('<button>').addClass('checkbox').html('&#x2713;')
        ).append(
          $('<span>').addClass('text').text(text)
        )
      )
      .addClass(url ? 'url=' + url : '');
  }

  // Register event listeners to handle completing and deleting.
  function addListeners() {
    $('span').click(function (e) {
      e.preventDefault();
      var li = $(this).parents('li');
      var id = li.attr('id');
      setUrl(id, !li.hasClass('url'));
    });

    $('button.delete').click(function (e) {
      e.preventDefault();
      var id = $(this).parents('li').attr('id');
      deleteRecord(id);
    });
  }

  // Hook form submit and add the new task.
  $('#addForm').submit(function (e) {
    e.preventDefault();

    if ($('#newBookmark').val().length > 0) {
      insertBookmark($('#newBookmark').val(), $('#newUrl').val());
      $('#newBookmark').val('');
      $('#newUrl').val('');
    }
    return false;
  });

  $('#newBookmark').focus();
});
